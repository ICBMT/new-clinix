<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Throwable;

class ExceptionReportMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Throwable $exception,
        public array $requestData = []
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[' . config('app.env') . '] Exception in ' . config('app.name') . ' - ' . class_basename($this->exception),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'mail.exception-report',
            with: [
                'exceptionClass' => class_basename($this->exception),
                'exceptionMessage' => $this->exception->getMessage() ?: 'No message available',
                'file' => $this->exception->getFile() ?: 'Unknown',
                'line' => $this->exception->getLine() ?: 0,
                'trace' => collect($this->exception->getTrace())
                    ->take(20)
                    ->map(function($trace, $index) {
                        $file = $trace['file'] ?? 'Unknown';
                        $line = $trace['line'] ?? 0;
                        $function = $trace['function'] ?? 'unknown';
                        $class = $trace['class'] ?? '';
                        $type = $trace['type'] ?? '';
                        
                        $call = '';
                        if (!empty($class)) {
                            $call = class_basename($class) . $type . $function . '()';
                        } else {
                            $call = $function . '()';
                        }
                        
                        return sprintf(
                            '#%d %s(%d): %s',
                            $index,
                            $file,
                            $line,
                            $call
                        );
                    })
                    ->toArray(),
                'occurredAt' => now()->toDateTimeString(),
                'request' => $this->requestData,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
