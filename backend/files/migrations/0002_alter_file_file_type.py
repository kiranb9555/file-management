# Generated by Django 5.0.2 on 2025-03-29 17:25

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("files", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="file",
            name="file_type",
            field=models.CharField(max_length=10),
        ),
    ]
