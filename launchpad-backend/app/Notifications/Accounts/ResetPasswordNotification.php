<?php

namespace App\Notifications\Accounts;

use App\Models\AuthToken;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly User $user) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $raw = AuthToken::issue($this->user, AuthToken::KIND_RESET_PASSWORD, ttlMinutes: 60);
        $url = rtrim(config('services.frontend.url'), '/')."/reset-password?token={$raw}";

        return (new MailMessage)
            ->subject('Reset your password')
            ->line('We received a request to reset your Launchpad password.')
            ->action('Reset password', $url)
            ->line('This link expires in 60 minutes. If you did not request this, you can ignore this email.');
    }
}
