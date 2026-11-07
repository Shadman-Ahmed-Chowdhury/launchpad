<?php

namespace App\Http\Requests\Products;

use App\Models\Product;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class AddScreenshotsRequest extends FormRequest
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
            'screenshots' => ['required', 'array', 'min:1'],
            'screenshots.*' => ['image', 'max:4096'],
        ];
    }

    /**
     * The 3-screenshot cap is enforced against how many the product already
     * has, which depends on the database — same reasoning as
     * `ScheduleProductRequest`'s launch-slot cap.
     *
     * @return array<callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->has('screenshots')) {
                    return;
                }

                $product = Product::where('slug', $this->route('slug'))->first();
                if (! $product) {
                    return;
                }

                $existing = $product->screenshots()->count();
                $incoming = count($this->file('screenshots') ?? []);

                if ($existing + $incoming > 3) {
                    $validator->errors()->add('screenshots', "A product can have at most 3 screenshots — it already has {$existing}.");
                }
            },
        ];
    }
}
