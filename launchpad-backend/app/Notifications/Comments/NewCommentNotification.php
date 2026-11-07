<?php

namespace App\Notifications\Comments;

use App\Models\Comment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * The founder is told when somebody comments on their product (see
 * docs/01-client-brief.md "Voting and comments") — sent via a queued job
 * (ADR-018) so a slow/down mail provider never blocks the comment request.
 */
class NewCommentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Comment $comment) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $product = $this->comment->product;
        $url = rtrim(config('services.frontend.url'), '/')."/products/{$product->slug}#comments";

        return (new MailMessage)
            ->subject("New comment on {$product->name}")
            ->line("{$this->comment->user->first_name} commented on {$product->name}:")
            ->line('"'.$this->comment->body.'"')
            ->action('View comment', $url);
    }
}
