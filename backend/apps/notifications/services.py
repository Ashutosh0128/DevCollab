from .models import Notification


def create_notification(recipient, actor, notification_type, message):
    """
    Centralized service helper for creating database-backed notifications.
    """
    if not recipient:
        return None

    # Don't notify oneself
    if actor and recipient.id == actor.id:
        return None

    return Notification.objects.create(
        recipient=recipient,
        actor=actor,
        notification_type=notification_type,
        message=message,
        is_read=False
    )


def notify_collaboration_request(request_obj):
    actor = request_obj.requester
    recipient = request_obj.project.owner
    actor_name = actor.full_name or actor.username
    project_title = request_obj.project.title
    message = f"{actor_name} sent a collaboration request for your project '{project_title}'."

    return create_notification(
        recipient=recipient,
        actor=actor,
        notification_type='COLLABORATION_REQUEST',
        message=message
    )


def notify_collaboration_accepted(request_obj):
    actor = request_obj.project.owner
    recipient = request_obj.requester
    project_title = request_obj.project.title
    message = f"Your collaboration request for '{project_title}' was accepted."

    return create_notification(
        recipient=recipient,
        actor=actor,
        notification_type='COLLABORATION_ACCEPTED',
        message=message
    )


def notify_collaboration_rejected(request_obj):
    actor = request_obj.project.owner
    recipient = request_obj.requester
    project_title = request_obj.project.title
    message = f"Your collaboration request for '{project_title}' was rejected."

    return create_notification(
        recipient=recipient,
        actor=actor,
        notification_type='COLLABORATION_REJECTED',
        message=message
    )


def notify_member_removed(project, removed_user, owner):
    owner_name = owner.full_name or owner.username
    message = f"You were removed from '{project.title}' by {owner_name}."

    return create_notification(
        recipient=removed_user,
        actor=owner,
        notification_type='MEMBER_REMOVED',
        message=message
    )


def notify_member_left(project, member):
    member_name = member.full_name or member.username
    recipient = project.owner
    message = f"{member_name} left your project '{project.title}'."

    return create_notification(
        recipient=recipient,
        actor=member,
        notification_type='MEMBER_LEFT',
        message=message
    )
