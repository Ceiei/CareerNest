from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict


class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid')


class ProfileWrite(StrictModel):
    profile: Dict[str, Any]
    expected_version: int = Field(ge=0)


class FactWrite(StrictModel):
    title: str = Field(min_length=1, max_length=200)
    text: str = Field(min_length=1, max_length=10000)
    record_id: str = ''
    context: str = ''
    actions: str = ''
    results: str = ''
    technologies: List[str] = Field(default_factory=list, max_length=100)
    evidence: List[str] = Field(default_factory=list, max_length=30)
    comfort: Literal['仅了解', '基础使用', '可以展开讲', '熟练掌握'] = '可以展开讲'
    expected_version: int = Field(ge=0)


class JobWrite(StrictModel):
    title: str = Field(min_length=1, max_length=300)
    organization: str = Field(default='', max_length=300)
    description: str = Field(min_length=1, max_length=40000)
    url: str = Field(default='', max_length=2000)
    mode: Literal['job', 'academic'] = 'job'


class PlanWrite(StrictModel):
    job_id: str
    fact_ids: List[str] = Field(min_length=1, max_length=40)
    expected_version: int = Field(ge=0)
    kind: Literal['resume', 'self_intro', 'interview_story'] = 'resume'


class Bullet(StrictModel):
    text: str = Field(min_length=1, max_length=10000)
    source_facts: List[str] = Field(min_length=1)


class ArtifactEdit(StrictModel):
    bullets: List[Bullet] = Field(min_length=1, max_length=50)
    expected_revision: int = Field(ge=1)


class ApproveWrite(StrictModel):
    expected_revision: int = Field(ge=1)
    reviewed: bool


class StatusWrite(StrictModel):
    status: Literal['准备中', '已投递', '面试中', '录取', '未通过', '已结束']


class AdaptWrite(StrictModel):
    expected_revision: int = Field(ge=1)
    base_url: str = Field(min_length=1, max_length=2000)
    api_key: str = Field(min_length=1, max_length=1000)
    model: str = Field(min_length=1, max_length=200)
    style: Literal['简历要点', '自我介绍', 'STAR 面试叙述'] = '简历要点'
    consent: bool


class PairWrite(StrictModel):
    code: str = Field(min_length=6, max_length=20)
