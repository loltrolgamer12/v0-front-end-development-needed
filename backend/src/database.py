"""
Sistema de Análisis de Inspecciones Vehiculares
---------------------------------------------
database.py - Módulo de gestión de base de datos

Este módulo maneja todas las operaciones de base de datos SQLite para el
sistema de inspecciones vehiculares.
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import pandas as pd
from typing import List, Dict, Optional

# Crear conexión a la base de datos
DATABASE_URL = "sqlite:///inspections.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Inspector(Base):
    """Modelo para la tabla de inspectores."""
    __tablename__ = "inspectors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    total_inspections = Column(Integer, default=0)
    last_inspection = Column(DateTime)
    active = Column(Boolean, default=True)
    
    inspections = relationship("Inspection", back_populates="inspector")

class Vehicle(Base):
    """Modelo para la tabla de vehículos."""
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    plate = Column(String, unique=True, index=True)
    total_inspections = Column(Integer, default=0)
    last_inspection = Column(DateTime)
    total_critical_failures = Column(Integer, default=0)
    compliance_rate = Column(Float, default=100.0)
    active = Column(Boolean, default=True)
    
    inspections = relationship("Inspection", back_populates="vehicle")

class Inspection(Base):
    """Modelo para la tabla de inspecciones."""
    __tablename__ = "inspections"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True)
    inspector_id = Column(Integer, ForeignKey("inspectors.id"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    location = Column(String)
    contract = Column(String)
    shift = Column(String)
    mileage = Column(Float)
    compliance_rate = Column(Float)
    has_critical_failures = Column(Boolean, default=False)
    total_failures = Column(Integer, default=0)
    
    inspector = relationship("Inspector", back_populates="inspections")
    vehicle = relationship("Vehicle", back_populates="inspections")
    items = relationship("InspectionItem", back_populates="inspection")

class InspectionItem(Base):
    """Modelo para la tabla de items de inspección."""
    __tablename__ = "inspection_items"
    
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    name = Column(String)
    status = Column(String)  # pass/fail/na
    is_critical = Column(Boolean)
    observations = Column(String, nullable=True)
    
    inspection = relationship("Inspection", back_populates="items")

# Crear todas las tablas
Base.metadata.create_all(bind=engine)

def get_db():
    """Proporciona una sesión de base de datos."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def save_inspections(df: pd.DataFrame) -> bool:
    """
    Guarda las inspecciones del DataFrame en la base de datos.
    
    Args:
        df: DataFrame con los datos de inspección
        
    Returns:
        bool: True si la operación fue exitosa, False en caso contrario
    """
    db = SessionLocal()
    try:
        # 1. Actualizar o crear todos los inspectores primero
        inspectors = {}
        for name in df['inspector'].unique():
            inspector = db.query(Inspector).filter_by(name=name).first()
            if inspector is None:
                inspector = Inspector(name=name, total_inspections=0, active=True)
                db.add(inspector)
            inspectors[name] = inspector
        
        # Commit para asegurar que todos los inspectores estén creados
        db.commit()
        
        # 2. Actualizar o crear todos los vehículos
        vehicles = {}
        for plate in df['placa'].unique():
            vehicle = db.query(Vehicle).filter_by(plate=plate).first()
            if vehicle is None:
                vehicle = Vehicle(
                    plate=plate,
                    total_inspections=0,
                    total_critical_failures=0,
                    compliance_rate=0,
                    active=True
                )
                db.add(vehicle)
            vehicles[plate] = vehicle
        
        # Commit para asegurar que todos los vehículos estén creados
        db.commit()
        
        # 3. Procesar cada inspección
        for _, row in df.iterrows():
            # Obtener inspector y vehículo
            inspector = inspectors[row['inspector']]
            vehicle = vehicles[row['placa']]
            
            # Actualizar contador de inspecciones
            inspector.total_inspections += 1
            inspector.last_inspection = row['timestamp']
            
            vehicle.total_inspections += 1
            vehicle.last_inspection = row['timestamp']
            vehicle.compliance_rate = ((vehicle.compliance_rate * (vehicle.total_inspections - 1)) + row['compliance_rate']) / vehicle.total_inspections
            
            # Crear inspección
            inspection = Inspection(
                timestamp=row['timestamp'],
                location=row['ubicacion'],
                contract=row['contrato'],
                shift=row['turno'],
                mileage=row['kilometraje'],
                compliance_rate=row['compliance_rate'],
                inspector=inspector,
                vehicle=vehicle
            )
            db.add(inspection)
            
            # Agregar items de inspección
            failures = 0
            for col in [c for c in df.columns if c.endswith('_cumple')]:
                item = InspectionItem(
                    inspection=inspection,
                    name=col.replace('_cumple', ''),
                    status=row[col],
                    is_critical=row[col] == 'no_cumple',
                    observations=row.get('observaciones', '')
                )
                db.add(item)
                
                if item.is_critical:
                    failures += 1
                    vehicle.total_critical_failures += 1
            
            inspection.total_failures = failures
            inspection.has_critical_failures = failures > 0
        
        # Commit todos los cambios
        db.commit()
        return True
        
    except Exception as e:
        print(f"Error al guardar inspecciones: {str(e)}")
        db.rollback()
        return False
        
    finally:
        db.close()

def get_inspections(filters: Optional[Dict] = None) -> pd.DataFrame:
    """
    Obtiene inspecciones aplicando filtros.
    
    Args:
        filters: Diccionario con los filtros a aplicar
        
    Returns:
        DataFrame con las inspecciones que cumplen los filtros
    """
    db = SessionLocal()
    try:
        # Construir query base
        query = db.query(Inspection)
        
        # Aplicar filtros si existen
        if filters:
            if 'start_date' in filters:
                query = query.filter(Inspection.timestamp >= filters['start_date'])
            if 'end_date' in filters:
                query = query.filter(Inspection.timestamp <= filters['end_date'])
            if 'inspector' in filters:
                query = query.join(Inspector).filter(Inspector.name == filters['inspector'])
            if 'vehicle' in filters:
                query = query.join(Vehicle).filter(Vehicle.plate == filters['vehicle'])
            if 'location' in filters:
                query = query.filter(Inspection.location == filters['location'])
        
        # Obtener resultados
        inspections = []
        for inspection in query.all():
            # Convertir cada inspección a diccionario
            inspection_dict = {
                'timestamp': inspection.timestamp,
                'inspector': inspection.inspector.name,
                'placa': inspection.vehicle.plate,
                'ubicacion': inspection.location,
                'contrato': inspection.contract,
                'turno': inspection.shift,
                'kilometraje': inspection.mileage,
                'compliance_rate': inspection.compliance_rate,
                'observaciones': ''  # Por defecto vacío
            }
            
            # Agregar status de cada item
            for item in inspection.items:
                inspection_dict[item.name + '_cumple'] = item.status
                if item.observations:
                    inspection_dict['observaciones'] = item.observations
            
            inspections.append(inspection_dict)
        
        # Convertir a DataFrame
        if inspections:
            return pd.DataFrame(inspections)
        else:
            return pd.DataFrame()
        
    finally:
        db.close()