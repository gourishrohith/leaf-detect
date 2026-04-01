from __future__ import annotations

import io
import os
import time
from dataclasses import dataclass
from typing import Literal, Optional

import jwt
from fastapi import Depends, FastAPI, File, Form, HTTPException, Header, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from PIL import Image, ImageStat
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import Boolean, Column, Integer, String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Session


JWT_SECRET = os.getenv("LEAFDETECT_JWT_SECRET", "dev-secret-change-me")
JWT_ISSUER = "leafdetect"
JWT_ALG = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class Base(DeclarativeBase):
    pass


class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    email = Column(String(320), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    purpose = Column(String(40), nullable=False)
    wants_chemicals = Column(Boolean, nullable=False, default=False)


engine = create_engine("sqlite:///./leafdetect.db", connect_args={"check_same_thread": False})
Base.metadata.create_all(engine)


Purpose = Literal[
    "farmer",
    "home_crop_grower",
    "student",
    "researcher",
    "gardener",
    "other",
]


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    purpose: Purpose
    wantsChemicals: bool = Field(alias="wantsChemicals")

    class Config:
        populate_by_name = True


class SignupIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    purpose: Purpose
    wantsChemicals: bool


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AuthOut(BaseModel):
    token: str
    user: UserOut


class AnalyzeOut(BaseModel):
    healthy: bool
    likelyIssue: str
    confidence: float
    explanation: str
    remedies: dict
    prevention: list[str]


def create_token(user_id: int) -> str:
    now = int(time.time())
    payload = {"iss": JWT_ISSUER, "sub": str(user_id), "iat": now, "exp": now + 60 * 60 * 24 * 7}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> int:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG], issuer=JWT_ISSUER)
        return int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_db():
    with Session(engine) as s:
        yield s


def bearer_user_id(authorization: Optional[str]) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    return decode_token(authorization.removeprefix("Bearer ").strip())


def _user_out(u: UserDB) -> UserOut:
    return UserOut(
        id=str(u.id),
        name=u.name,
        email=u.email,
        purpose=u.purpose,  # type: ignore[arg-type]
        wantsChemicals=u.wants_chemicals,
    )


app = FastAPI(title="LeafDetect API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/auth/signup", response_model=AuthOut)
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    existing = db.scalar(select(UserDB).where(UserDB.email == payload.email))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    u = UserDB(
        name=payload.name,
        email=str(payload.email),
        password_hash=pwd_context.hash(payload.password),
        purpose=payload.purpose,
        wants_chemicals=payload.wantsChemicals,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return AuthOut(token=create_token(u.id), user=_user_out(u))


@app.post("/auth/login", response_model=AuthOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    u = db.scalar(select(UserDB).where(UserDB.email == payload.email))
    if not u or not pwd_context.verify(payload.password, u.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return AuthOut(token=create_token(u.id), user=_user_out(u))


@dataclass
class ImgSignals:
    green_ratio: float
    redness: float
    contrast: float


def extract_signals(img: Image.Image) -> ImgSignals:
    im = img.convert("RGB")
    # shrink for speed
    im.thumbnail((512, 512))
    stat = ImageStat.Stat(im)
    r, g, b = stat.mean
    total = max(r + g + b, 1e-6)
    green_ratio = g / total
    redness = (r - g) / max(total, 1e-6)

    # simple contrast proxy: stdev average
    sr, sg, sb = stat.stddev
    contrast = (sr + sg + sb) / 3.0 / 255.0
    return ImgSignals(green_ratio=green_ratio, redness=redness, contrast=contrast)


def diagnose(signals: ImgSignals) -> tuple[bool, str, float, str]:
    # Very lightweight heuristic (placeholder for a real ML model).
    # Output is still structured and UI-ready.
    if signals.green_ratio > 0.39 and signals.redness < 0.02 and signals.contrast < 0.20:
        return (
            True,
            "Healthy leaf",
            0.78,
            "Color balance and texture look consistent with a healthy leaf in this image.",
        )
    if signals.redness > 0.05:
        return (
            False,
            "Possible nutrient deficiency / stress (yellowing or reddening)",
            0.68,
            "The image has a higher red component relative to green, which can happen with stress, deficiency, or aging leaves.",
        )
    if signals.contrast > 0.25:
        return (
            False,
            "Possible fungal/bacterial spotting",
            0.71,
            "Higher texture contrast can indicate spotting or lesion patterns. Consider inspecting both sides of the leaf.",
        )
    return (
        False,
        "Possible early-stage issue",
        0.60,
        "Signals are mixed. For a clearer result, use brighter lighting and a closer shot of the affected area.",
    )


def remedy_pack(wants_chemicals: bool, purpose: Purpose) -> tuple[dict, list[str]]:
    home = [
        "Remove heavily affected leaves and dispose (don’t compost if infection is suspected).",
        "Avoid overhead watering; water the soil early morning.",
        "Improve airflow by spacing plants and pruning dense growth.",
        "Wipe tools with alcohol between plants to reduce spread.",
    ]
    chemical = [
        "Use a crop-appropriate fungicide/bactericide (follow label, PPE, and pre-harvest intervals).",
        "Rotate active ingredients to reduce resistance risk.",
        "Treat early and repeat per label schedule if symptoms persist.",
    ]
    prevention = [
        "Inspect plants weekly and isolate new plants for a few days.",
        "Keep leaves dry when possible; reduce humidity and improve ventilation.",
        "Clean up plant debris at end of season; rotate crops if recurring.",
    ]

    if purpose == "farmer":
        prevention.insert(0, "Track outbreaks by plot; remove hotspots quickly to limit spread.")
        home.insert(0, "Scout a wider sample across the field to confirm pattern, not a single plant.")

    remedies = {"home": home, "chemical": chemical}
    if not wants_chemicals:
        remedies = {"home": home, "chemical": []}
    return remedies, prevention


@app.post("/analyze", response_model=AnalyzeOut)
async def analyze(
    image: UploadFile = File(...),
    wantsChemicals: bool = Form(False),
    purpose: Purpose = Form("home_crop_grower"),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    user_id = bearer_user_id(authorization)
    u = db.get(UserDB, user_id)
    if not u:
        raise HTTPException(status_code=401, detail="Unknown user")

    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty image")
    try:
        img = Image.open(io.BytesIO(raw))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    signals = extract_signals(img)
    healthy, likely_issue, confidence, explanation = diagnose(signals)
    remedies, prevention = remedy_pack(wants_chemicals=wantsChemicals, purpose=purpose)

    if healthy:
        remedies = {
            "home": ["Keep consistent watering and avoid wetting leaves late in the day."],
            "chemical": ["No chemical treatment recommended for a healthy leaf."],
        }
        prevention = [
            "Maintain consistent watering and adequate sunlight.",
            "Keep tools clean and inspect plants weekly.",
            "Avoid overcrowding to improve airflow.",
        ]

    return AnalyzeOut(
        healthy=healthy,
        likelyIssue=likely_issue,
        confidence=float(max(0.5, min(0.95, confidence))),
        explanation=explanation,
        remedies=remedies,
        prevention=prevention,
    )

