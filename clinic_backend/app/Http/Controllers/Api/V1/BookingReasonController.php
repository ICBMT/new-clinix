<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\BookingReasonRepositoryInterface;
use App\Enums\BookingReasonType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Booking\BookingReasonRequest;
use App\Http\Resources\Api\V1\Booking\BookingReasonResource;
use Illuminate\Http\JsonResponse;

class BookingReasonController extends Controller
{
    public function __construct(
        private readonly BookingReasonRepositoryInterface $bookingReasonRepository
    ) {}

    /**
     * Return booking reasons filtered by type.
     */
    public function index(BookingReasonRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $type = BookingReasonType::from($request->validated()['type']);

            $reasons = $this->bookingReasonRepository->getReasonsByType($type);

            return response()->json([
                'success' => true,
                'data' => BookingReasonResource::collection($reasons),
            ]);
        });
    }
}


