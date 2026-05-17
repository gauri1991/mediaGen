from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

TEST_USERS = [
    {
        'email': 'admin@mediagen.dev',
        'password': 'Admin1234!',
        'first_name': 'Admin',
        'last_name': 'User',
        'is_staff': True,
        'is_superuser': True,
    },
    {
        'email': 'editor@mediagen.dev',
        'password': 'Editor1234!',
        'first_name': 'Editor',
        'last_name': 'User',
        'is_staff': True,
        'is_superuser': False,
    },
    {
        'email': 'user@mediagen.dev',
        'password': 'User1234!',
        'first_name': 'Regular',
        'last_name': 'User',
        'is_staff': False,
        'is_superuser': False,
    },
]


class Command(BaseCommand):
    help = 'Create test accounts for development (admin, editor, regular user)'

    def handle(self, *args, **options):
        self.stdout.write('Creating test accounts...\n')

        for spec in TEST_USERS:
            email = spec['email']
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email,
                    'first_name': spec['first_name'],
                    'last_name': spec['last_name'],
                    'is_staff': spec['is_staff'],
                    'is_superuser': spec['is_superuser'],
                    'is_active': True,
                },
            )

            if created:
                user.set_password(spec['password'])
                user.save(update_fields=['password'])
                status = 'created'
            else:
                # Update role flags in case they changed
                user.is_staff = spec['is_staff']
                user.is_superuser = spec['is_superuser']
                user.set_password(spec['password'])
                user.save(update_fields=['is_staff', 'is_superuser', 'password'])
                status = 'updated'

            role = 'superuser' if spec['is_superuser'] else ('staff' if spec['is_staff'] else 'user')
            self.stdout.write(
                f'  [{status}] {email} ({role}) — password: {spec["password"]}'
            )

        self.stdout.write(self.style.SUCCESS('\nDone. Test accounts ready.'))
        self.stdout.write('\nAdmin panel: http://localhost:8000/admin/')
        self.stdout.write('Login at:    http://localhost:3000/login\n')
