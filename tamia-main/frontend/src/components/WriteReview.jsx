import { useState } from 'react';
import { Star } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

export default function WriteReview({ sellerId, listingId = null, onReviewSubmitted }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { user } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const tokenResponse = await fetch('/api/csrf-token', {
                credentials: 'include',
                headers: { Accept: 'application/json' },
            });
            const tokenData = await tokenResponse.json().catch(() => ({}));
            const token = tokenData.csrf_token;

            const response = await fetch('/api/reviews', {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify({
                    seller_id: sellerId,
                    listing_id: listingId,
                    rating,
                    comment,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit review');
            }

            setMessage('Review submitted successfully!');
            setRating(0);
            setComment('');
            
            // Call callback to refresh reviews
            if (onReviewSubmitted) {
                onReviewSubmitted();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 text-center">
                <p className="text-gray-600">
                    <a href="/login" className="text-jiji-orange font-bold hover:underline">Sign in</a> to leave a review for this seller
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-lg font-bold font-outfit text-gray-900 mb-6 uppercase tracking-wider text-sm">Leave a Review</h3>

            {message && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                    {message}
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rating */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div className="flex gap-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110"
                            >
                                <Star
                                    size={32}
                                    weight={
                                        star <= (hoverRating || rating)
                                            ? 'fill'
                                            : 'regular'
                                    }
                                    className={
                                        star <= (hoverRating || rating)
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                                    }
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Comment */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Review (optional)
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience with this seller..."
                        rows={4}
                        maxLength={1000}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20 resize-none"
                    />
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest text-right">
                        {comment.length} / 1000
                    </p>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={!rating || loading}
                    className="w-full bg-jiji-orange text-white font-bold py-4 rounded-2xl hover:bg-[#E65A00] disabled:bg-gray-200 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-100"
                >
                    {loading ? 'Submitting...' : 'Submit Review'}
                </button>
            </form>
        </div>
    );
}
