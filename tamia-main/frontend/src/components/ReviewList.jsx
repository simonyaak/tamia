import { useState, useEffect } from 'react';
import { Star, ThumbsUp } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

export default function ReviewList({ sellerId, listingId = null, onDataLoaded }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [avgRating, setAvgRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        fetchReviews();
    }, [sellerId, listingId]);

    const fetchReviews = async () => {
        try {
            const endpoint = listingId
                ? `/api/listings/${listingId}/reviews`
                : `/api/users/${sellerId}/reviews`;

            const response = await fetch(endpoint, { 
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });
            const data = await response.json();

            setReviews(data.reviews);
            setAvgRating(data.average_rating || 0);
            setTotalReviews(data.total_reviews || 0);
            
            if (onDataLoaded) {
                onDataLoaded(data);
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleHelpfulVote = async (reviewId) => {
        if (!user) {
            alert('Please log in to vote');
            return;
        }

        try {
            const tokenResponse = await fetch('/api/csrf-token', {
                credentials: 'include',
                headers: { Accept: 'application/json' },
            });
            const tokenData = await tokenResponse.json().catch(() => ({}));
            const token = tokenData.csrf_token;

            const response = await fetch(
                `/api/reviews/${reviewId}/helpful`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': token,
                    },
                }
            );

            const data = await response.json();
            
            // Refresh reviews
            await fetchReviews();
        } catch (err) {
            console.error('Error voting:', err);
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={16}
                        weight={star <= rating ? 'fill' : 'regular'}
                        className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return <div className="text-center py-8">Loading reviews...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Review Summary */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-8">
                    <div className="text-center">
                        <p className="text-5xl font-bold font-outfit text-gray-900">{avgRating}</p>
                        <div className="flex justify-center mt-3">{renderStars(Math.round(avgRating))}</div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">{totalReviews} reviews</p>
                    </div>
                    <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => (
                            <div key={rating} className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-400 w-3">{rating}</span>
                                <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-jiji-orange rounded-full" 
                                        style={{ width: `${totalReviews ? (reviews.filter(r => Math.round(r.rating) === rating).length / totalReviews * 100) : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            {reviews.length > 0 ? (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-white border border-gray-50 rounded-[32px] p-6 shadow-sm hover:border-gray-100 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-xs font-bold text-gray-400">
                                        {review.reviewer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{review.reviewer.name}</p>
                                        <div className="flex gap-2 items-center mt-0.5">
                                            {renderStars(review.rating)}
                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {review.comment && (
                                <p className="text-gray-600 text-sm leading-relaxed mb-6">{review.comment}</p>
                            )}

                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => handleHelpfulVote(review.id)}
                                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-jiji-orange transition-colors"
                                >
                                    <ThumbsUp size={14} weight="bold" />
                                    Helpful ({review.helpful_count})
                                </button>
                                {review.listing && (
                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                        Ref: AD-{review.listing.id}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <p>No reviews yet</p>
                </div>
            )}
        </div>
    );
}
