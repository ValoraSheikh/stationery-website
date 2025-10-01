import { StarIcon } from "@heroicons/react/20/solid";
import React, { useState } from "react";

const ReviewComponent = ({ productId }: { productId: string }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || !review.trim()) {
      setError("Please provide both rating and feedback.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          rating,
          text: review,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      setSuccess("Review submitted successfully!");
      setRating(0);
      setHoverRating(0);
      setReview("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-white">
        <div className="max-w-3/3 mx-auto bg-white rounded-2xl shadow-2xs p-8 lg:max-w-2/3">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Write a Review</h2>
          <p className="text-gray-600 text-sm mb-6">
            Share your experience with this product.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-6">
              <div className="flex flex-col items-start mb-4 sm:mb-0">
                <label className="text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex items-center space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={`h-6 w-6 cursor-pointer transition-colors ${
                        star <= (hoverRating || rating)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      } hover:text-yellow-300`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Feedback</label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your thought about the product"
                  maxLength={2000}
                  className="w-full border border-gray-200 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-32 sm:h-40"
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {review.length}/2000
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {success && <p className="text-green-500 text-sm mt-2">{success}</p>}

            <div className="flex space-x-3 justify-end mt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-sm text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewComponent;
