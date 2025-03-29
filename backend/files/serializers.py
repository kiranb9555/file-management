from rest_framework import serializers
from .models import File

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['id', 'filename', 'file_type', 'upload_date', 'file_size']
        read_only_fields = ['upload_date', 'file_size']

class FileUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['file'] 