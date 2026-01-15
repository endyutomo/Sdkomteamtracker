export type NotificationType =
    | 'booking_request'
    | 'booking_accepted'
    | 'booking_rejected'
    | 'shipment_update'
    | 'system';

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: {
        booking_id?: string;
        shipment_id?: string;
        booking_date?: string;
        booking_time?: string;
        notes?: string;
        sender_name?: string;
        recipient_name?: string;
        item_description?: string;
        driver_name?: string;
        rejection_reason?: string;
        [key: string]: any;
    };
    read: boolean;
    action_taken: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface NotificationFormData {
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
}
