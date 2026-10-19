<?php

namespace App\Notifications\Accounts;

use App\Models\AuthToken;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailNotification extends Notification implements ShouldQueue
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
        $raw = AuthToken::issue($this->user, AuthToken::KIND_VERIFY_EMAIL, ttlMinutes: 60);
        $url = rtrim(config('services.frontend.url'), '/')."/verify-email?token={$raw}";

        return (new MailMessage)
            ->subject('Confirm your email address')
            ->line('Confirm this is your email address to start voting and commenting on Launchpad.')
            ->action('Verify email', $url)
            ->line('This link expires in 60 minutes.');
    }
}
