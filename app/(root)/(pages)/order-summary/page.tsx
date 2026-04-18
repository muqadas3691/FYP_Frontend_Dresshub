 "use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { NotificationModal } from "@/app/components/Modal/NotificationModal"
import { ShoppingBag, Calendar, Truck, CreditCard, X } from "lucide-react"

interface OrderProduct {
  _id: string
  title: string
  image: string
  price: number
  size: string
  productListing: string
  productBrand: string
}

interface OrderDetails {
  orderId: string
  products: OrderProduct[]
  totalAmount: number
  subtotal: number
  discount: number
  rewardsUsed: number
  orderDate: string
  paymentMethod: string
  status: string
  transactionId?: string
}

export default function OrderSummary() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Retrieve order details from localStorage
    const storedOrder = localStorage.getItem("lastOrder")
    if (storedOrder) {
      setOrderDetails(JSON.parse(storedOrder))
    }
    setLoading(false)
  }, [])

  const handleConfirmOrder = () => {
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    // Navigate to home page when modal is closed
    router.push("/")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-PK', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const getDeliveryEstimate = () => {
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + 5) // 5 days delivery estimate
    return deliveryDate.toLocaleDateString('en-PK', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF4EF]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#632C0F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order summary...</p>
        </div>
      </div>
    )
  }

  if (!orderDetails || !orderDetails.products || orderDetails.products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF4EF] p-4">
        <div className="w-full max-w-md bg-[#F1E4D19C] rounded-lg p-8 text-center space-y-4">
          <ShoppingBag className="w-16 h-16 mx-auto text-gray-400" />
          <h1 className="text-2xl font-semibold">No Order Found</h1>
          <p className="text-gray-600">You don't have any recent orders.</p>
          <Link href="/">
            <Button className="bg-[#632C0F] hover:bg-[#4A2109] text-white">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <NotificationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        heading="Order Confirmed"
        text="Your Order has been confirmed you can track your order."
      />

      <div className="min-h-screen bg-[#FAF4EF] p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#632C0F]">Order Summary</h1>
            <p className="text-gray-600 mt-2">Thank you for your purchase!</p>
          </div>

          {/* Order Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Truck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Delivery By</p>
                  <p className="font-semibold">{getDeliveryEstimate()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-semibold capitalize">{orderDetails.paymentMethod}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-semibold">{formatDate(orderDetails.orderDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-[#F1E4D19C] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Items Ordered
            </h2>
            
            <div className="space-y-4">
              {orderDetails.products.map((product) => (
                <div key={product._id} className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image 
                      src={product.image || "/placeholder.svg"} 
                      alt={product.title} 
                      fill 
                      className="object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{product.title}</h3>
                    <p className="text-sm text-gray-500">Size: {product.size}</p>
                    <p className="text-sm text-gray-500">Brand: {product.productBrand}</p>
                    <p className="text-[#632C0F] font-semibold mt-1">
                      PKR {product.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Price Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>PKR {orderDetails.subtotal.toLocaleString()}</span>
              </div>
              
              {orderDetails.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount (Rewards Applied)</span>
                  <span>- PKR {orderDetails.discount.toLocaleString()}</span>
                </div>
              )}
              
              {orderDetails.rewardsUsed > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Rewards Used</span>
                  <span>{orderDetails.rewardsUsed} rewards</span>
                </div>
              )}
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount</span>
                  <span className="text-[#632C0F]">PKR {orderDetails.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order ID and Transaction ID */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-sm">{orderDetails.orderId}</span>
              </div>
              {orderDetails.transactionId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-sm">{orderDetails.transactionId}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold ${
                  orderDetails.status === "Complete" ? "text-green-600" : "text-yellow-600"
                }`}>
                  {orderDetails.status}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleConfirmOrder}
              className="flex-1 bg-[#632C0F] hover:bg-[#4A2109] text-white rounded-md py-3"
            >
              Confirm Order
            </Button>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full border-[#632C0F] text-[#632C0F] hover:bg-[#632C0F]/10">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}