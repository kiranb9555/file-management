from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Count, Sum
from django.http import FileResponse
from .models import File
from .serializers import FileSerializer, FileUploadSerializer
from datetime import datetime, timedelta
from django.db import models

class FileViewSet(viewsets.ModelViewSet):
    serializer_class = FileSerializer

    def get_permissions(self):
        if self.action == 'dashboard_stats':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        if self.request.user.is_staff:
            return File.objects.all()
        return File.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return FileUploadSerializer
        return FileSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        try:
            file_obj = self.get_object()
            response = FileResponse(file_obj.file, as_attachment=True)
            response['Content-Disposition'] = f'attachment; filename="{file_obj.filename}"'
            return response
        except Exception as e:
            print(f"Download error: {str(e)}")
            return Response(
                {"error": "Failed to download file"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, url_path='dashboard-stats')
    def dashboard_stats(self, request):
        try:
            # Get all files for public stats
            base_queryset = File.objects.all()
            today = datetime.now()
            last_week = today - timedelta(days=7)

            # Get user statistics
            user_stats = base_queryset.values('user__email', 'user__username').annotate(
                file_count=Count('id'),
                recent_uploads=Count('id', filter=models.Q(upload_date__gte=last_week))
            ).order_by('-file_count')

            # Get file type statistics
            file_types = base_queryset.values('file_type').annotate(
                count=Count('id')
            ).order_by('-count')

            # Categorize file types
            type_categories = {
                'Documents': ['pdf', 'doc', 'docx', 'txt'],
                'Spreadsheets': ['xls', 'xlsx', 'csv'],
                'Images': ['jpg', 'jpeg', 'png', 'gif'],
                'Others': []
            }

            categorized_stats = {category: 0 for category in type_categories.keys()}
            
            for ft in file_types:
                file_type = ft['file_type'].lower()
                category_found = False
                for category, extensions in type_categories.items():
                    if file_type in extensions:
                        categorized_stats[category] += ft['count']
                        category_found = True
                        break
                if not category_found:
                    categorized_stats['Others'] += ft['count']

            # Prepare response data
            stats = {
                'total_files': base_queryset.count(),
                'recent_uploads': base_queryset.filter(upload_date__gte=last_week).count(),
                'user_stats': [
                    {
                        'username': item['user__username'],
                        'email': item['user__email'],
                        'file_count': item['file_count'],
                        'recent_uploads': item['recent_uploads']
                    } for item in user_stats
                ],
                'file_types': [
                    {'type': category, 'count': count}
                    for category, count in categorized_stats.items()
                    if count > 0
                ]
            }
            
            return Response(stats)
        except Exception as e:
            print(f"Error getting dashboard stats: {str(e)}")
            return Response(
                {"error": "Failed to get dashboard statistics"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error in list: {str(e)}")
            return Response(
                {"error": "Failed to fetch files"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 