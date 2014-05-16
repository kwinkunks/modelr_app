from google.appengine.ext import db
from google.appengine.ext import blobstore
"""
Authentication and permissions will be structured similar to linux
wuth groups and users. Group permissions can be added to an item to
allow other users permission to view and edit the item.
"""


class ModelrParent(db.Model):
    """
    parent to all of modelr to allow for strongly consistent queries
    """
    pass

class UserID(db.Model):
    next_id = db.IntegerProperty()

class ModelServedCount(db.Model):
    """
    Item to keep track of how many models have been served by modelr
    """
    count = db.IntegerProperty()
    
class Issue(db.Model):
    """
    Item for GitHub issues for voting
    """
    issue_id = db.IntegerProperty()
    vote = db.IntegerProperty()
    
    
class User(db.Model):

    user_id = db.IntegerProperty()
    email = db.EmailProperty()
    password = db.StringProperty()
    salt = db.StringProperty()
    group = db.StringListProperty()
    stripe_id = db.StringProperty()
    tax_code = db.StringProperty()
    unsubscribed = db.BooleanProperty(default=False)

class ActivityLog(db.Model):

    user_id = db.IntegerProperty()
    activity = db.StringProperty()
    date = db.DateTimeProperty(auto_now_add=True)
    
class VerifyUser(User):
    """
    Temporary user objects to store user information while we wait
    for a confirmation
    """
    temp_id = db.StringProperty()
    

class Item(db.Model):
    """
    Base class for items in the modelr database
    """
    user = db.IntegerProperty()
    group = db.StringProperty()
    date = db.DateTimeProperty(auto_now_add=True)


class Group(db.Model):

    name = db.StringProperty()
    allowed_users = db.ListProperty(int)
    admin = db.IntegerProperty()

class GroupRequest(db.Model):

    user = db.IntegerProperty()
    group = db.StringProperty()

class ImageModel(Item):
    
    image = blobstore.BlobReferenceProperty()

class Forward2DModel(Item):

    name = db.StringProperty(multiline=False)
    input_model_key = db.StringProperty()
    output_image = blobstore.BlobReferenceProperty()
    data = db.BlobProperty()
    
class Scenario(Item):
    '''
    Database of Scenarios 
    '''
    name = db.StringProperty(multiline=False)
    
    data = db.BlobProperty()

class Rock(Item):
    """
    Database of Rocks
    """
    
    name = db.StringProperty(multiline=False)
    description = db.StringProperty(multiline=True)

    vp = db.FloatProperty()
    vs = db.FloatProperty()
    rho = db.FloatProperty()
    vp_std = db.FloatProperty()
    vs_std = db.FloatProperty()
    rho_std = db.FloatProperty()

