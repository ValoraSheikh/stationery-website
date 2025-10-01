'use client'

import { useEffect, useState } from 'react'
import { StarIcon } from '@heroicons/react/20/solid'
import Image from 'next/image'

function classNames(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(' ')
}

interface APIReview {
  id: string
  rating: number
  text: string
  date: string
  user?: {
    id: string
    name: string
    avatar?: string
  }
}

interface APIResponse {
  reviews: APIReview[]
}

interface Review {
  id: string
  rating: number
  content: string
  date: string
  datetime: string
  author: string
  avatarSrc: string
}

interface ReviewsProps {
  productId: string
}

export default function Reviews({ productId }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    if (!productId) return

async function fetchReviews() {
  try {
    const res = await fetch(`/api/review?productId=${productId}`)
    if (!res.ok) throw new Error('Failed to fetch reviews')

    const data: APIResponse = await res.json()

    const formatted: Review[] = data.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      content: `<p>${r.text}</p>`,
      date: new Date(r.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      datetime: new Date(r.date).toISOString().split('T')[0],
      author: r.user?.name || 'Anonymous',
      avatarSrc: r.user?.avatar ?? '/img/user (1).png',
    }))

    setReviews(formatted)
  } catch (err) {
    console.error(err)
  }
}

    fetchReviews()
  }, [productId])

  return (
    <div className="bg-white lg:max-w-2/3 mx-auto py-8 max-w-3/3 px-5">
      <h2 className="sr-only">Customer Reviews</h2>

      <div className="-my-10">
        {reviews.map((review, reviewIdx) => (
          <div key={review.id} className="flex space-x-4 text-sm text-gray-500">
            <div className="flex-none py-10">
              <Image
                height={500}
                width={500}
                alt={review.author}
                src={review.avatarSrc}
                className="size-10 rounded-full bg-gray-100"
              />
            </div>
            <div
              className={classNames(
                reviewIdx === 0 ? '' : 'border-t border-gray-200',
                'flex-1 py-10'
              )}
            >
              <h3 className="font-medium text-gray-900">{review.author}</h3>
              <p>
                <time dateTime={review.datetime}>{review.date}</time>
              </p>

              <div className="mt-4 flex items-center">
                {[0, 1, 2, 3, 4].map((rating) => (
                  <StarIcon
                    key={rating}
                    aria-hidden="true"
                    className={classNames(
                      review.rating > rating ? 'text-yellow-400' : 'text-gray-300',
                      'size-5 shrink-0'
                    )}
                  />
                ))}
              </div>
              <p className="sr-only">{review.rating} out of 5 stars</p>

              <div
                dangerouslySetInnerHTML={{ __html: review.content }}
                className="mt-4 text-sm/6 text-gray-500"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
