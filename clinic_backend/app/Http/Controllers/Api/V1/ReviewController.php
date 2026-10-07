<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Review\StoreReviewRequest;
use App\Contracts\ReviewRepositoryInterface;
use App\Models\Booking;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function __construct(
        private readonly ReviewRepositoryInterface $reviewRepository,
        private readonly \App\Contracts\BookingRepositoryInterface $bookingRepository
    ) {}

    /**
     * Store review for a clinic
     * Requires booking_id to be selected
     */
    public function store(StoreReviewRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
            $data = $request->validated();
            
            // Verify booking belongs to user and clinic using repository
            $booking = $this->bookingRepository->findBy([
                'id' => $data['booking_id'],
                'user_id' => $user->id,
                'clinic_id' => $data['clinic_id'],
                'treatment_id' => $data['treatment_id'],
            ]);

            if (!$booking) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.booking_not_found_or_not_authorized'),
                ], 404);
            }

            // Check if review already exists using booking relationship
            $existingReview = $booking->reviews()->where('user_id', $user->id)->first();

            if ($existingReview) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.review_already_provided_for_booking'),
                ], 422);
            }

            // Create review
            $review = $this->reviewRepository->create([
                'booking_id' => $data['booking_id'],
                'user_id' => $user->id,
                'clinic_id' => $data['clinic_id'],
                'treatment_id' => $data['treatment_id'],
                'rating' => $data['rating'],
                'comment' => $data['comment'] ?? null,
                'would_recommend' => $data['would_recommend'] ?? false,
            ]);

            // Mark booking as review provided using repository
            $this->bookingRepository->update($booking->id, [
                'is_review_provided' => true,
                'review_provided_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => __('common.review_submitted_successfully'),
                'data' => [
                    'review' => [
                        'id' => $review->id,
                        'booking_id' => $review->booking_id,
                        'treatment_id' => $review->treatment_id,
                        'clinic_id' => $review->clinic_id,
                        'rating' => $review->rating,
                        'comment' => $review->comment,
                        'would_recommend' => $review->would_recommend,
                        'created_at' => $review->created_at?->toISOString(),
                    ],
                ]
            ], 201);
        });
    }

    /**
     * Get reviews for a clinic
     */
    public function getClinicReviews(int $id, Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $perPage = $request->get('per_page', 15);
            
            // Use clinic relationship to get reviews
            $clinicRepository = app(\App\Contracts\ClinicRepositoryInterface::class);
            $clinic = $clinicRepository->find($id);
            
            if (!$clinic) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.clinic_not_found'),
                ], 404);
            }
            
            $reviews = $clinic->reviews()
                ->with(['user', 'booking', 'treatment'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => [
                    'reviews' => $reviews->getCollection()->map(function ($review) {
                        return [
                            'id' => $review->id,
                            'booking_id' => $review->booking_id,
                            'treatment_id' => $review->treatment_id,
                            'rating' => $review->rating,
                            'comment' => $review->comment,
                            'would_recommend' => $review->would_recommend,
                            'user' => [
                                'id' => $review->user->id,
                                'name' => $review->user->name,
                                'avatar' => $review->user->avatar,
                            ],
                            'treatment' => $review->treatment ? [
                                'id' => $review->treatment->id,
                                'name_en' => $review->treatment->name_en,
                                'name_ar' => $review->treatment->name_ar,
                            ] : null,
                            'created_at' => $review->created_at?->toISOString(),
                        ];
                    }),
                    'pagination' => [
                        'current_page' => $reviews->currentPage(),
                        'last_page' => $reviews->lastPage(),
                        'per_page' => $reviews->perPage(),
                        'total' => $reviews->total(),
                    ]
                ]
            ]);
        });
    }

    /**
     * Get reviews for a treatment
     */
    public function getTreatmentReviews(int $id, Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $perPage = $request->get('per_page', 15);
            
            // Use treatment relationship to get reviews
            $treatmentRepository = app(\App\Contracts\TreatmentRepositoryInterface::class);
            $treatment = $treatmentRepository->find($id);
            
            if (!$treatment) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.treatment_not_found'),
                ], 404);
            }
            
            $reviews = $treatment->reviews()
                ->with(['user', 'booking', 'treatment'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => [
                    'reviews' => $reviews->getCollection()->map(function ($review) {
                        return [
                            'id' => $review->id,
                            'booking_id' => $review->booking_id,
                            'treatment_id' => $review->treatment_id,
                            'rating' => $review->rating,
                            'comment' => $review->comment,
                            'would_recommend' => $review->would_recommend,
                            'user' => [
                                'id' => $review->user->id,
                                'name' => $review->user->name,
                                'avatar' => $review->user->avatar,
                            ],
                            'treatment' => $review->treatment ? [
                                'id' => $review->treatment->id,
                                'name_en' => $review->treatment->name_en,
                                'name_ar' => $review->treatment->name_ar,
                            ] : null,
                            'created_at' => $review->created_at?->toISOString(),
                        ];
                    }),
                    'pagination' => [
                        'current_page' => $reviews->currentPage(),
                        'last_page' => $reviews->lastPage(),
                        'per_page' => $reviews->perPage(),
                        'total' => $reviews->total(),
                    ]
                ]
            ]);
        });
    }
}


