"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function EditProfessionalPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the details page, which will handle opening the edit modal
    router.replace(`/professionals/${params.id}`)
  }, [params.id, router])

  // Show nothing while redirecting
  return null
} 