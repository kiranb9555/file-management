from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, AddressSerializer
from .models import Address

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'login']:  # 'create' is for registration
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['GET', 'PATCH'], permission_classes=[IsAuthenticated])
    def profile(self, request):
        try:
            if request.method == 'GET':
                serializer = self.get_serializer(request.user)
                return Response(serializer.data)
            elif request.method == 'PATCH':
                print(f"Profile update data: {request.data}")
                
                serializer = self.get_serializer(
                    request.user,
                    data=request.data,
                    partial=True,
                    context={'request': request}
                )
                
                try:
                    if serializer.is_valid():
                        user = serializer.save()
                        return Response(self.get_serializer(user).data)
                    else:
                        print(f"Validation errors: {serializer.errors}")
                        return Response(
                            {'error': 'Invalid data provided', 'details': serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except Exception as e:
                    print(f"Save error: {str(e)}")
                    return Response(
                        {'error': f'Failed to save profile: {str(e)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
        except Exception as e:
            print(f"Profile error: {str(e)}")
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['POST'], permission_classes=[AllowAny])
    def login(self, request):
        email = request.data.get('email', '').lower()
        password = request.data.get('password')
        
        try:
            # Log the login attempt
            print(f"Login attempt for email: {email}")
            
            # Use case-insensitive lookup
            user = User.objects.get(email__iexact=email)
            if user.check_password(password):
                refresh = RefreshToken.for_user(user)
                try:
                    user_data = UserSerializer(user).data
                except Exception as e:
                    # If there's an error serializing addresses, return minimal user data
                    user_data = {
                        'id': user.id,
                        'email': user.email,
                        'username': user.username
                    }
                    print(f"Error serializing user data: {str(e)}")
                
                response_data = {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': user_data
                }
                print("Login successful")
                return Response(response_data)
            
            print("Invalid password")
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        except User.DoesNotExist:
            print(f"User not found with email: {email}")
            return Response(
                {'error': 'No account found with this email'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Login error: {str(e)}")
            return Response(
                {'error': 'An error occurred during login'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        if serializer.validated_data.get('is_default', False):
            Address.objects.filter(user=self.request.user, is_default=True).update(is_default=False)
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.validated_data.get('is_default', False):
            Address.objects.filter(user=self.request.user, is_default=True).exclude(
                id=serializer.instance.id
            ).update(is_default=False)
        serializer.save()

    def perform_destroy(self, instance):
        if instance.is_default:
            other_address = Address.objects.filter(
                user=self.request.user
            ).exclude(id=instance.id).first()
            if other_address:
                other_address.is_default = True
                other_address.save()
        instance.delete() 