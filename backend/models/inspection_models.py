import os
from datetime import datetime, date
from typing import Dict, List, Optional, Union
from dataclasses import dataclass
from enum import Enum

class RiskLevel(Enum):
    LOW = "Bajo"
    MEDIUM = "Medio"
    HIGH = "Alto"
    CRITICAL = "Crítico"

class Status(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

@dataclass
class InspectionItem:
    compliant: bool
    is_critical: bool
    value: str

@dataclass
class Inspection:
    id: int
    timestamp: str
    date: datetime
    year: str
    month: str
    day: str
    inspector: str
    vehicle: str
    contract: str
    location: str
    compliance: float
    critical_failures: int
    total_items: int
    risk_level: RiskLevel
    status: Status
    items: Dict[str, InspectionItem]

@dataclass
class Statistics:
    total_inspections: int
    average_compliance: float
    critical_failures: int
    date_range: Dict[str, str]
    unique_counts: Dict[str, int]

@dataclass
class UniqueValues:
    inspectors: List[str]
    vehicles: List[str]
    contracts: List[str]
    locations: List[str]

@dataclass
class ProcessedData:
    inspections: List[Inspection]
    stats: Statistics
    unique_values: UniqueValues