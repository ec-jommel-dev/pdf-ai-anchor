"""
ProviderPDF Model - Stored PDFs for preview feature
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
    content_hash = db.Column(db.String(64))  # SHA-256 hash for duplicate detection
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert PDF info to dictionary for JSON response"""
        return {
            'id': self.id,
            'filename': self.filename,
            'fileSize': self.file_size,
            'totalPages': self.total_pages,
            'contentHash': self.content_hash,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def find_by_hash(content_hash: str):
        """Find PDF by content hash (for duplicate detection)"""
        return ProviderPDF.query.filter_by(content_hash=content_hash).first()
    
    def __repr__(self):
        return f'<ProviderPDF {self.filename}>'
