"""
Provider Model - Energy company/provider entity
"""
from database import db
from datetime import datetime

class Provider(db.Model):
    __tablename__ = 'providers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    anchors = db.relationship('Anchor', backref='provider', lazy=True, cascade='all, delete-orphan')
    pdf = db.relationship('ProviderPDF', backref='provider', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert provider to dictionary for JSON response"""
        return {
            'id': str(self.id),
            'name': self.name,
            'active': self.is_active,
            'anchors': [anchor.to_dict() for anchor in self.anchors],
            'hasPdf': self.pdf is not None
        }
    
    def __repr__(self):
        return f'<Provider {self.name}>'
