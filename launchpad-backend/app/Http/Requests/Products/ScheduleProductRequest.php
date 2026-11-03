<?php

namespace App\Http\Requests\Products;

use App\Models\Product;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class ScheduleProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'launch_date' => ['required', 'date', 'after_or_equal:today'],
        ];
    }

    /**
     * Only a set number of products may launch on the same day (see
     * docs/02-features.md "limited slots per day", ADR-027) — a cap that
     * depends on the other products already in the database, so it's
     * checked here rather than as a stateless rule.
     *
     * @return array<callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->has('launch_date')) {
                    return;
                }

                $takenSlots = Product::where('launch_date', $this->input('launch_date'))
                    ->where('slug', '!=', $this->route('slug'))
                    ->whereIn('status', ['scheduled', 'launched'])
                    ->count();

                if ($takenSlots >= config('launchpad.max_launches_per_day')) {
                    $validator->errors()->add('launch_date', 'That day is fully booked — pick another.');
                }
            },
        ];
    }
}
