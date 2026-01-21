"""
ProviderPDF Model - Stored PDFs for preview feature
Now supports multiple PDFs per provider, each with its own anchors
"""
from database import db
from datetime import datetime

class ProviderPDF(db.Model):
    __tablename__ = 'provider_pdfs'
    
    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('providers.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)  # Size in bytes
    total_pages = db.Column(db.Integer)  # Number of pages
    canvas_width = db.Column(db.Integer)  # Canvas width for coordinate conversion
    canvas_height = db.Column(db.Integer)  # Canvas height for coordinate conversion
    content_hash = db.Column(db.String(64))  # SHA-256 hash for duplicate detection
    is_active = db.Column(db.Boolean, default=True)  # Soft delete support
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship: PDF has many Anchors
    anchors = db.relationship('Anchor', backref='pdf', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_anchors=True):
        """Convert PDF info to dictionary for JSON response"""
        data = {
            'id': self.id,
            'providerId': self.provider_id,
            'filename': self.filename,
            'filePath': self.file_path,
            'fileSize': self.file_size,
            'totalPages': self.total_pages,
            'canvasWidth': self.canvas_width,
            'canvasHeight': self.canvas_height,
            'contentHash': self.content_hash,
            'isActive': self.is_active,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'anchorCount': len(self.anchors) if self.anchors else 0
        }
        if include_anchors:
            data['anchors'] = [anchor.to_dict() for anchor in self.anchors]
        return data
    
    @staticmethod
    def find_by_hash(content_hash: str):
        """Find PDF by content hash (for duplicate detection)"""
        return ProviderPDF.query.filter_by(content_hash=content_hash).first()
    
    def __repr__(self):
        return f'<ProviderPDF {self.filename}>'
