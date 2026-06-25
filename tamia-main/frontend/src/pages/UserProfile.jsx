import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, Star, ShieldCheck, CalendarBlank, CheckCircle } from '@phosphor-icons/react';
import ReviewList from '../components/ReviewList';
import WriteReview from '../components/WriteReview';
import FollowButton from '../components/FollowButton';
import { useAuth } from '../context/AuthContext';

export default function UserProfile() {
    const { userId } = useParams();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `/storage/${path}`;
    };

    const { user: authUser } = useAuth();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`/api/users/${userId}`, {
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to load profile');
                }

                const data = await response.json();
                setProfileData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId]);

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading profile...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
    }

    if (!profileData || !profileData.user) {
        return <div className="flex justify-center items-center min-h-screen">Profile not found</div>;
    }

    const { user, stats, recent_listings } = profileData;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 md:px-6 lg:px-8">
            {/* Profile Header */}
            <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-600">
                    {user.cover_photo && (
                        <img src={getImageUrl(user.cover_photo)} alt="Cover" className="w-full h-full object-cover" />
                    )}
                </div>
                
                <div className="relative px-6 md:px-8 pb-8">
                    {/* Avatar */}
                    <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 mb-6">
                        <div className="flex items-end gap-4 w-full">
                            {user.avatar ? (
                                <img
                                    src={getImageUrl(user.avatar)}
                                    alt={user.name}
                                    className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-gray-200 object-cover"
                                />
                            ) : (
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                                    {user.name}
                                    {user.is_verified && (
                                        <ShieldCheck weight="fill" className="text-[#00B53F]" size={28} title="ID Verified" />
                                    )}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 mt-3">
                                    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                        <CalendarBlank size={16} />
                                        Joined {new Date(user.created_at || Date.now()).getFullYear()}
                                    </span>
                                    {user.phone_verified_at && (
                                        <span className="flex items-center gap-1.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                                            <CheckCircle weight="bold" size={16} />
                                            Phone Verified
                                        </span>
                                    )}
                                    {user.is_business && (
                                        <span className="flex items-center gap-1.5 text-sm font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full">
                                            Business Account
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {user.location && (
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">Location</p>
                                <p className="text-gray-900 text-lg">{user.location}</p>
                            </div>
                        )}
                        {user.whatsapp_number && (
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">WhatsApp</p>
                                <a href={`https://wa.me/${user.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-lg">
                                    {user.whatsapp_number}
                                </a>
                            </div>
                        )}
                    </div>
                    {profileData.user.id !== authUser?.id ? (
                        <div className="mb-8">
                            <FollowButton
                                sellerId={profileData.user.id}
                                initialIsFollowing={profileData.is_following}
                                initialFollowers={profileData.stats.followers_count || 0}
                                onToggle={(following, followerCount) => {
                                    setProfileData((prev) => prev ? ({
                                        ...prev,
                                        is_following: following,
                                        stats: {
                                            ...prev.stats,
                                            followers_count: followerCount,
                                        },
                                    }) : prev)
                                }}
                            />
                        </div>
                    ) : (
                        <div className="mb-8">
                            <a 
                                href="/account" 
                                className="inline-flex items-center justify-center rounded-xl border-2 border-gray-900 bg-white px-6 py-2 text-sm font-bold text-gray-900 transition hover:bg-gray-900 hover:text-white"
                            >
                                Edit Profile
                            </a>
                        </div>
                    )}

                    {user.bio && (
                        <div className="mb-8">
                            <p className="text-gray-600 text-sm font-semibold mb-2">About</p>
                            <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-6 bg-gray-50 rounded-lg">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{stats.listing_count}</p>
                            <p className="text-gray-600 text-sm mt-1">Active Listings</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-purple-600">{stats.followers_count?.toLocaleString() || 0}</p>
                            <p className="text-gray-600 text-sm mt-1">Followers</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">{stats.total_views.toLocaleString()}</p>
                            <p className="text-gray-600 text-sm mt-1">Total Views</p>
                        </div>
                        <div className="text-center">
                            <div className="flex justify-center items-center gap-1">
                                <Star size={24} weight="fill" className="text-yellow-400" />
                                <p className="text-3xl font-bold text-yellow-600">{stats.average_rating || 'N/A'}</p>
                            </div>
                            <p className="text-gray-600 text-sm mt-1">Rating ({stats.review_count})</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="max-w-6xl mx-auto mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Reviews List */}
                    <div className="lg:col-span-2">
                        <ReviewList sellerId={userId} />
                    </div>
                    
                    {/* Write Review Form */}
                    <div>
                        <WriteReview 
                            sellerId={userId}
                            onReviewSubmitted={() => {
                                // Refetch profile to update review count
                                const fetchProfile = async () => {
                                    const response = await fetch(`/api/users/${userId}`, {
                                        credentials: 'include',
                                    });
                                    const data = await response.json();
                                    setProfileData(data);
                                };
                                fetchProfile();
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Recent Listings */}
            {recent_listings && recent_listings.length > 0 && (
                <div className="max-w-6xl mx-auto mt-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Listings</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {recent_listings.map((listing) => (
                            <a
                                key={listing.id}
                                href={`/listing/${listing.slug}`}
                                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
                            >
                                {/* Image */}
                                <div className="relative aspect-video bg-gray-200 overflow-hidden">
                                    {listing.primary_image ? (
                                        <img
                                            src={getImageUrl(listing.primary_image.path)}
                                            alt={listing.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                            <span className="text-gray-500">No image</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity" />
                                </div>

                                {/* Card Content */}
                                <div className="p-3 md:p-4">
                                    <h3 className="font-semibold text-sm md:text-base text-gray-900 line-clamp-2 mb-2">
                                        {listing.title}
                                    </h3>
                                    <div className="flex justify-between items-center">
                                        <p className="text-lg md:text-xl font-bold text-blue-600">
                                            {listing.currency}{' '}
                                            {parseInt(listing.price).toLocaleString()}
                                        </p>
                                        {listing.views_count && (
                                            <div className="text-gray-500 text-xs flex items-center gap-1">
                                                <Eye size={14} />
                                                {listing.views_count}
                                            </div>
                                        )}
                                    </div>
                                    {listing.category && (
                                        <p className="text-xs text-gray-500 mt-2">{listing.category.name}</p>
                                    )}
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {(!recent_listings || recent_listings.length === 0) && (
                <div className="max-w-6xl mx-auto mt-12">
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No active listings yet</p>
                    </div>
                </div>
            )}
        </div>
    );
}
