from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class File(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='user_files/')
    filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10)  # Will store actual extension
    upload_date = models.DateTimeField(auto_now_add=True)
    file_size = models.IntegerField()  # Size in bytes

    def __str__(self):
        return f"{self.filename} - {self.user.email}"

    def save(self, *args, **kwargs):
        if not self.filename:
            self.filename = self.file.name
        
        # Get the actual file extension without categorizing
        self.file_type = self.filename.split('.')[-1].upper() if '.' in self.filename else ''
        
        if not self.file_size:
            self.file_size = self.file.size
        super().save(*args, **kwargs) 