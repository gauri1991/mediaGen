from django.contrib import admin
from django.urls import path
from ninja_extra import NinjaExtraAPI
from ninja_jwt.controller import NinjaJWTDefaultController
from users.api import router as users_router
from generations.api import router as generations_router
from projects.api import router as projects_router

api = NinjaExtraAPI(title='MediaGen API', version='1.0.0')
api.register_controllers(NinjaJWTDefaultController)
api.add_router('/users', users_router)
api.add_router('/generations', generations_router)
api.add_router('/projects', projects_router)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
]
