import copy
import tempfile
import unittest
import json
import shutil
import httpx
from unittest.mock import patch
from pathlib import Path
from fastapi.testclient import TestClient

from local_service.app import EMPTY, create_app, tex_escape
from local_service.engine import validate_bullets
from local_service.migrate import migrate


class CareerServiceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.client = TestClient(create_app(self.temp.name, 'test-key'))
        self.client.headers['X-Career-Token'] = 'test-key'

    def tearDown(self):
        self.temp.cleanup()

    def put_profile(self):
        profile = copy.deepcopy(EMPTY)
        profile['personal'] = dict(fullName='示例同学', email='demo@example.invalid')
        profile['projects'] = [dict(id='project-1', projectName='预测模型实验', description='使用 Python 进行时间序列回测', achievements='比较 3 种基线模型')]
        return self.client.put('/api/profile', json=dict(profile=profile, expected_version=0)).json()

    def artifact(self):
        self.put_profile()
        job = self.client.post('/api/jobs/parse', json=dict(title='数据科学实习', description='熟悉 Python 和时间序列', mode='job')).json()
        match = self.client.post(f"/api/jobs/{job['id']}/match").json()
        self.assertGreater(match['facts'][0]['score'], 0)
        response = self.client.post('/api/resume/plan', json=dict(job_id=job['id'], fact_ids=[match['facts'][0]['id']], expected_version=1))
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def test_auth_and_host_origin(self):
        self.assertEqual(self.client.get('/api/profile', headers={'X-Career-Token':'wrong'}).status_code, 401)
        self.assertEqual(self.client.get('/api/profile', headers={'Origin':'https://untrusted.invalid'}).status_code, 403)
        self.assertEqual(self.client.get('/health').status_code, 200)

    def reader_token(self):
        code=self.client.post('/api/desktop/pair-code').json()['code']
        response=self.client.post('/api/pair',json={'code':code})
        self.assertEqual(response.status_code,200)
        self.assertEqual(self.client.post('/api/pair',json={'code':code}).status_code,403)
        return response.json()['token']

    def test_paired_extension_is_read_only(self):
        token=self.reader_token();headers={'X-Career-Token':token,'Origin':'chrome-extension://'+'a'*32}
        self.assertEqual(self.client.get('/api/profile',headers=headers).status_code,200)
        self.assertEqual(self.client.put('/api/profile',headers=headers,json={'profile':EMPTY,'expected_version':0}).status_code,403)
        self.assertEqual(self.client.post('/api/facts',headers=headers,json={'title':'x','text':'y','expected_version':0}).status_code,403)
        self.assertEqual(self.client.get('/api/backup',headers=headers).status_code,403)
        self.assertEqual(self.client.post('/api/desktop/pair-code',headers=headers).status_code,403)
        self.assertEqual(self.client.get('/desktop',headers=headers).status_code,403)

    def test_browser_import_requires_desktop_confirmation(self):
        token=self.reader_token();headers={'X-Career-Token':token}
        candidate=copy.deepcopy(EMPTY);candidate['personal']={'fullName':'迁移示例'}
        r=self.client.post('/api/migration/browser',headers=headers,json={'profile':candidate,'expected_version':0})
        self.assertTrue(r.json()['staged']);self.assertEqual(self.client.get('/api/profile').json()['version'],0)
        staged=self.client.get('/api/migration/browser').json()['profile']
        self.assertEqual(self.client.put('/api/profile',json={'profile':staged,'expected_version':0}).status_code,200)
        self.assertEqual(self.client.get('/api/profile').json()['profile']['personal']['fullName'],'迁移示例')

    def test_pairing_attempt_limit_and_no_external_editor(self):
        code=self.client.post('/api/desktop/pair-code').json()['code']
        for _ in range(5):self.assertEqual(self.client.post('/api/pair',json={'code':'00000000'}).status_code,403)
        self.assertEqual(self.client.post('/api/pair',json={'code':code}).status_code,403)
        self.assertNotIn('<form',self.client.get('/').text)
        self.assertEqual(self.client.get('/desktop',headers={'X-Career-Token':'bad'}).status_code,401)

    def test_data_directory_migration_preserves_source_and_never_overwrites(self):
        self.put_profile();target=Path(self.temp.name)/'new-location'
        self.assertEqual(migrate(self.temp.name,target),'migrated')
        self.assertTrue((Path(self.temp.name)/'career.db').exists())
        copied=TestClient(create_app(target,'copy-key'));copied.headers['X-Career-Token']='copy-key'
        self.assertEqual(copied.get('/api/profile').json()['profile']['personal']['fullName'],'示例同学')
        self.assertEqual(migrate(self.temp.name,target),'target_exists')

    def test_profile_roundtrip_and_stale_writes(self):
        saved = self.put_profile()
        self.assertEqual(saved['version'], 1)
        self.assertEqual(self.client.get('/api/profile').json()['profile']['projects'][0]['id'], 'project-1')
        self.assertEqual(self.client.put('/api/profile', json=dict(profile=EMPTY, expected_version=0)).status_code, 409)
        self.assertEqual(self.client.get('/api/profile').json()['profile'], saved['profile'])

    def test_facts_link_evidence_and_history(self):
        self.put_profile()
        response = self.client.post('/api/facts', json=dict(title='模型回测', text='完成 3 组回测', record_id='project-1', evidence=['https://example.invalid/report'], comfort='基础使用', expected_version=1))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['version'], 2)
        data = self.client.get('/api/backup').json()
        self.assertEqual(len(data['versions']), 2)
        self.assertEqual(data['facts'][0]['record_id'], 'project-1')
        self.assertEqual(data['profile']['projects'][0]['projectName'], '预测模型实验')

    def test_bad_evidence_rejected(self):
        response = self.client.post('/api/facts', json=dict(title='证据',text='描述',evidence=['javascript:alert(1)'],expected_version=0))
        self.assertEqual(response.status_code, 422)
        self.assertEqual(self.client.get('/api/profile').json()['version'],0)

    def test_material_does_not_mutate_truth_and_rejects_invented_number(self):
        a = self.artifact()
        before = self.client.get('/api/profile').json()
        response = self.client.put('/api/artifacts/'+a['id'], json=dict(expected_revision=1,bullets=[dict(text='准确率提高 25%',source_facts=a['bullets'][0]['source_facts'])]))
        self.assertEqual(response.status_code, 422)
        self.assertEqual(self.client.get('/api/profile').json(), before)

    def test_material_rejects_unknown_reference(self):
        a = self.artifact()
        response = self.client.put('/api/artifacts/'+a['id'], json=dict(expected_revision=1,bullets=[dict(text='示例',source_facts=['fake-fact'])]))
        self.assertEqual(response.status_code, 422)

    def test_approval_invalidated_by_fact_change(self):
        a = self.artifact()
        self.assertEqual(self.client.post(f"/api/artifacts/{a['id']}/approve",json=dict(expected_revision=1,reviewed=False)).status_code,422)
        self.client.post('/api/facts',json=dict(title='新事实',text='新增证据',expected_version=1))
        self.assertEqual(self.client.post(f"/api/artifacts/{a['id']}/approve",json=dict(expected_revision=1,reviewed=True)).status_code,409)

    @unittest.skipUnless(shutil.which('xelatex'), 'Install XeLaTeX to run the real PDF integration test')
    def test_pdf_compile_and_download(self):
        a = self.artifact()
        self.assertEqual(self.client.post(f"/api/artifacts/{a['id']}/compile").status_code,422)
        self.client.post(f"/api/artifacts/{a['id']}/approve",json=dict(expected_revision=1,reviewed=True))
        response = self.client.post(f"/api/artifacts/{a['id']}/compile")
        self.assertEqual(response.status_code,200,response.text)
        pdf = self.client.get(response.json()['pdf'])
        self.assertTrue(pdf.content.startswith(b'%PDF'))
        stored=self.client.get('/api/artifacts').json()[0]
        self.assertEqual(stored['compiled_revision'],stored['revision'])
        self.assertIn('预测模型实验',self.client.get(response.json()['tex']).text)

    def test_missing_pdf_dependency_is_actionable(self):
        a = self.artifact()
        self.client.post(f"/api/artifacts/{a['id']}/approve", json=dict(expected_revision=1, reviewed=True))
        with patch('local_service.app.shutil.which', return_value=None):
            result = self.client.post(f"/api/artifacts/{a['id']}/compile")
        self.assertEqual(result.status_code, 503)
        self.assertIn('TeX Live', result.json()['detail'])

    def test_comfort_and_tex_injection(self):
        result=validate_bullets([dict(text='精通 Python',source_facts=['a'])],{'a':dict(text='使用 Python',comfort='仅了解')})
        self.assertFalse(result['valid'])
        escaped=tex_escape(r'\input{/etc/passwd} 25%')
        self.assertNotIn(r'\input{',escaped)
        self.assertIn(r'25\%',escaped)

    def test_material_revision_history_preserves_original(self):
        a = self.artifact()
        edited = self.client.put('/api/artifacts/'+a['id'], json=dict(expected_revision=1,bullets=[dict(text='使用 Python 进行时间序列回测，比较 3 种基线模型',source_facts=a['bullets'][0]['source_facts'])]))
        self.assertEqual(edited.status_code,200,edited.text)
        history = self.client.get(f"/api/artifacts/{a['id']}/history").json()
        self.assertEqual([r['revision'] for r in history],[2,1])
        self.assertEqual(history[1]['bullets'],a['bullets'])

    def test_atomic_results_are_valid_sources(self):
        sources={'fact:a':dict(text='完成模型回测',results='对比 3 种基线',comfort='可以展开讲')}
        self.assertTrue(validate_bullets([dict(text='完成 3 种基线回测',source_facts=['fact:a'])],sources)['valid'])

    def test_ai_new_draft_keeps_truth_and_secrets_out_of_storage(self):
        a=self.artifact()
        before=self.client.get('/api/profile').json()
        captured=[]
        def model_reply(request):
            captured.append(json.loads(request.content))
            return httpx.Response(200,json={'choices':[{'message':{'content':json.dumps({'bullets':a['bullets']})}}]})
        client=httpx.AsyncClient(transport=httpx.MockTransport(model_reply))
        with patch('local_service.app.httpx.AsyncClient',return_value=client):
            response=self.client.post(f"/api/artifacts/{a['id']}/adapt",json=dict(expected_revision=1,base_url='https://model.example.invalid/v1',api_key='secret-test-key',model='mock',style='简历要点',consent=True))
        self.assertEqual(response.status_code,200,response.text)
        self.assertNotEqual(response.json()['id'],a['id'])
        self.assertEqual(response.json()['status'],'draft')
        self.assertEqual(self.client.get('/api/profile').json(),before)
        self.assertNotIn('demo@example.invalid',json.dumps(captured))
        self.assertNotIn('secret-test-key',self.client.get('/api/backup').text)

    def test_ai_invented_metrics_rejected(self):
        a=self.artifact()
        invented=dict(text='提升准确率 25%',source_facts=a['bullets'][0]['source_facts'])
        client=httpx.AsyncClient(transport=httpx.MockTransport(lambda request:httpx.Response(200,json={'choices':[{'message':{'content':json.dumps({'bullets':[invented]})}}]})))
        with patch('local_service.app.httpx.AsyncClient',return_value=client):
            response=self.client.post(f"/api/artifacts/{a['id']}/adapt",json=dict(expected_revision=1,base_url='https://model.example.invalid/v1',api_key='test-key',model='mock',style='简历要点',consent=True))
        self.assertEqual(response.status_code,422,response.text)
        self.assertEqual(len(self.client.get('/api/artifacts').json()),1)


if __name__ == '__main__':
    unittest.main()
