"""
Provider Model - Energy company/provider entity
Now supports multiple PDFs, each with its own anchors
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
    
    # Relationships: Provider has many PDFs (each PDF has many Anchors)
    pdfs = db.relationship('ProviderPDF', backref='provider', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_pdfs=True):
        """Convert provider to dictionary for JSON response"""
        data = {
            'id': str(self.id),
            'name': self.name,
            'active': self.is_active,
            'pdfCount': len(self.pdfs) if self.pdfs else 0
        }
        
        if include_pdfs:
            # Include PDFs with their anchors
            data['pdfs'] = [pdf.to_dict() for pdf in self.pdfs if pdf.is_active]
            # Flatten all anchors for backward compatibility
            all_anchors = []
            for pdf in self.pdfs:
                if pdf.is_active:
                    all_anchors.extend([a.to_dict() for a in pdf.anchors])
            data['anchors'] = all_anchors
        
        return data
    
    def __repr__(self):
        return f'<Provider {self.name}>'
