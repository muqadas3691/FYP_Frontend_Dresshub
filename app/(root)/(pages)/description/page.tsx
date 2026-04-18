 "use client"

import { useState } from "react"
import TopBanner from "@/app/components/global/top-banner"
import { ClothingCard } from "../../../components/global/clothing-card"
import FooterBanner from "@/app/components/global/footer-banner"
import { Filter } from "lucide-react"
import { SubHeader } from "@/app/components/global/sub-header"
import RentersPolicy from "@/app/components/global/renter-policy"
import { Button } from "@/components/ui/button"
import { FilterSheet } from "@/app/components/global/filter-sheet"
import { RenterPolicyBanner } from "@/app/components/global/renter-policy-banner"
import { useSearchParams } from "next/navigation"

export default function Home() {
  const search = useSearchParams()
  const type = search.get("type")

  const [showPolicy, setShowPolicy] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const products = [/* SAME ARRAY AS YOUR CODE */]

  return (
    <main className="h-screen bg-[#F6E7DB]">
      <TopBanner back={true} />
      <SubHeader showSearch={true} />

      {showPolicy && type == "rent" && (
        <div className="w-full bg-[#F6E7DB]">
          <RentersPolicy onClose={() => setShowPolicy(false)} />
        </div>
      )}

      <h1 className="text-[#542D18] text-center text-[48px] font-semibold">Products</h1>

      <div className="flex items-center space-x-4 text-start text-[20px] mx-24 mt-8">
        <Button
          variant="ghost"
          className="flex items-center space-x-2 text-[20px] hover:bg-transparent hover:text-[#542D18]"
          onClick={() => setShowFilters(true)}
        >
          <span className="text-black">Filters</span>
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      <FilterSheet open={showFilters} onOpenChange={setShowFilters} />

      <hr className="md:mx-16" />

      <div className="bg-[#F6E7DB] md:px-24 p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products
            .filter((p) => p.action.toLowerCase() == type)
            .map((product) => (
              <ClothingCard
                key={product.id}
                imageUrl={product.imageUrl}
                title={product.title}
                price={product.price}
                action={product.action}
              />
            ))}
        </div>
      </div>

      <RenterPolicyBanner />
      <FooterBanner />
    </main>
  )
}