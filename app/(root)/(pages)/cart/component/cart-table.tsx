 "use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, Trash2, Loader2, Gift, Wallet, Building } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import axios from "axios"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface CartItem {
  _id: string
  title: string
  image: string
  price: number
  size: string
  productListing: string
  productBrand: string
  dateAdded: string
  storeId?: string
}

interface PaymentDetails {
  accountNumber?: string
  phoneNumber?: string
  bankName?: string
  accountHolderName?: string
}

export default function CartTable() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [productArray, setProductArray] = useState<any>([])
  const [orderLoading, setOrderLoading] = useState(false)
  const [rewards, setRewards] = useState(0)
  const [appliedRewards, setAppliedRewards] = useState(false)
  const [originalTotal, setOriginalTotal] = useState(0)
  const [discountedTotal, setDiscountedTotal] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [showPaymentSection, setShowPaymentSection] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({})
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  useEffect(() => {
    const fetchCartItems = () => {
      setLoading(true)
      try {
        if (typeof window !== "undefined") {
          const storedItems = localStorage.getItem("cartItems")
          if (storedItems) {
            const parsedItems = JSON.parse(storedItems)
            setCartItems(parsedItems)
            setProductArray(parsedItems.map((item: any) => ({ 
              productId: item._id, 
              storeId: item.storeId, 
              quantity: 1 
            })))
          }
        }
      } catch (error) {
        console.error("Error fetching cart items:", error)
        toast.error("Failed to load cart items")
      } finally {
        setLoading(false)
      }
    }

    fetchCartItems()
    fetchUserRewards()
  }, [])

  const fetchUserRewards = async () => {
    try {
      const userStr = localStorage.getItem("user")
      if (!userStr) return

      const user = JSON.parse(userStr)
      const response = await axios.get(`${process.env.NEXT_PUBLIC_LOOP_SERVER}/order/rewards/${user.userId}`)

      if (response.data) {
        setRewards(response.data.rewards)
      }
    } catch (error) {
      console.error("Error fetching rewards:", error)
    }
  }

  const removeFromCart = (_id: string) => {
    setRemovingId(_id)
    try {
      const updatedItems = cartItems.filter((item) => item._id !== _id)
      setCartItems(updatedItems)
      if (typeof window !== "undefined") {
        localStorage.setItem("cartItems", JSON.stringify(updatedItems))
      }
      toast.success("Item removed from cart")
    } catch (error) {
      toast.error("Failed to remove item from cart")
    } finally {
      setRemovingId(null)
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price, 0)
  }

  useEffect(() => {
    const total = calculateTotal()
    setOriginalTotal(total)
    if (appliedRewards) {
      const discount = Math.min(rewards * 100, total)
      setDiscountedTotal(total - discount)
    } else {
      setDiscountedTotal(total)
    }
  }, [cartItems, rewards, appliedRewards])

  const applyRewards = () => {
    if (rewards === 0) {
      toast.error("You don't have any rewards to apply!")
      return
    }
    
    const total = calculateTotal()
    const maxDiscount = Math.min(rewards * 100, total)
    
    if (maxDiscount <= 0) {
      toast.error("Rewards cannot be applied to this order!")
      return
    }
    
    setAppliedRewards(true)
    toast.success(`Applied ${Math.floor(maxDiscount / 100)} rewards! Discount: PKR ${maxDiscount.toLocaleString()}`)
  }

  const cancelRewards = () => {
    setAppliedRewards(false)
    toast.info("Rewards removed from order")
  }

  const processEasypaisaPayment = async (amount: number, phoneNumber: string) => {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_LOOP_SERVER}/order/payment/easypaisa`, {
      amount,
      phoneNumber,
      userId: JSON.parse(localStorage.getItem("user") || "{}").userId
    })
    return response.data
  }

  const processBankTransfer = async (amount: number, bankDetails: any) => {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_LOOP_SERVER}/order/payment/bank-transfer`, {
      amount,
      ...bankDetails,
      userId: JSON.parse(localStorage.getItem("user") || "{}").userId
    })
    return response.data
  }

  const createOrder = async (transactionId: string) => {
    const user = localStorage.getItem("user")
    if (!user) {
      toast.error("Please login to create order.")
      return false
    }

    const parsedData = JSON.parse(user)
    const totalAmount = Number(appliedRewards ? discountedTotal : originalTotal)

    const data = {
      userId: parsedData.userId,
      status: paymentMethod === "cod" ? "Pending" : "Complete",
      products: productArray,
      totalPrice: totalAmount,
      rewardsUsage: appliedRewards,
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "Pending" : "Paid",
      transactionId: transactionId,
      orderDate: new Date().toISOString()
    }

    const res = await axios.post(`${process.env.NEXT_PUBLIC_LOOP_SERVER}/order/create`, data)
    return res.data
  }

  // REPLACE YOUR EXISTING handleCODOrder WITH THIS:
  const handleCODOrder = async () => {
    setOrderLoading(true)
    try {
      const transactionId = `COD_${Date.now()}_${Date.now()}`
      const orderResult = await createOrder(transactionId)
      
      if (orderResult) {
        toast.success("Order created successfully! You will pay on delivery.")
        
        // Store order details in localStorage before navigating
        const orderDetails = {
          orderId: orderResult._id,
          products: cartItems,
          totalAmount: appliedRewards ? discountedTotal : originalTotal,
          subtotal: originalTotal,
          discount: appliedRewards ? (originalTotal - discountedTotal) : 0,
          rewardsUsed: appliedRewards ? Math.min(rewards * 100, originalTotal) / 100 : 0,
          orderDate: new Date().toISOString(),
          paymentMethod: "cod",
          status: "Pending"
        }
        localStorage.setItem("lastOrder", JSON.stringify(orderDetails))
        
        setCartItems([])
        localStorage.removeItem("cartItems")
        setShowPaymentSection(false)
        setAppliedRewards(false)
        setPaymentMethod("cod")
        setPaymentDetails({})
        
        setTimeout(() => {
          router.push("/order-summary")
        }, 1500)
      }
    } catch (e) {
      toast.error("Failed to create order. Please try again.")
      console.error("Order creation error:", e)
    } finally {
      setOrderLoading(false)
    }
  }

  // REPLACE YOUR EXISTING handlePaymentSubmit WITH THIS UPDATED VERSION:
  const handlePaymentSubmit = async () => {
    const totalAmount = Number(appliedRewards ? discountedTotal : originalTotal)
    setIsProcessingPayment(true)
    
    try {
      let paymentResult = null
      
      if (paymentMethod === "easypaisa") {
        if (!paymentDetails.phoneNumber || paymentDetails.phoneNumber.length < 10) {
          toast.error("Please enter a valid phone number")
          setIsProcessingPayment(false)
          return
        }
        
        toast.info("Processing Easypaisa payment...", { autoClose: false, toastId: "paymentProcessing" })
        paymentResult = await processEasypaisaPayment(totalAmount, paymentDetails.phoneNumber)
        toast.dismiss("paymentProcessing")
        
      } else if (paymentMethod === "bank") {
        if (!paymentDetails.bankName || !paymentDetails.accountNumber || !paymentDetails.accountHolderName) {
          toast.error("Please enter complete bank details")
          setIsProcessingPayment(false)
          return
        }
        
        toast.info("Processing Bank Transfer...", { autoClose: false, toastId: "paymentProcessing" })
        paymentResult = await processBankTransfer(totalAmount, paymentDetails)
        toast.dismiss("paymentProcessing")
      }
      
      if (paymentResult && paymentResult.success) {
        setShowPaymentModal(false)
        
        const orderResult = await createOrder(paymentResult.transactionId)
        
        if (orderResult) {
          toast.success("Order created successfully!")
          
          // Store order details in localStorage
          const orderDetails = {
            orderId: orderResult._id,
            products: cartItems,
            totalAmount: appliedRewards ? discountedTotal : originalTotal,
            subtotal: originalTotal,
            discount: appliedRewards ? (originalTotal - discountedTotal) : 0,
            rewardsUsed: appliedRewards ? Math.min(rewards * 100, originalTotal) / 100 : 0,
            orderDate: new Date().toISOString(),
            paymentMethod: paymentMethod,
            status: "Complete",
            transactionId: paymentResult.transactionId
          }
          localStorage.setItem("lastOrder", JSON.stringify(orderDetails))
          
          setCartItems([])
          localStorage.removeItem("cartItems")
          setShowPaymentSection(false)
          setAppliedRewards(false)
          setPaymentMethod("cod")
          setPaymentDetails({})
          
          setTimeout(() => {
            router.push("/order-summary")
          }, 1500)
        }
      } else {
        toast.error(paymentResult?.message || "Payment failed. Please try again.")
      }
      
    } catch (error) {
      toast.dismiss("paymentProcessing")
      toast.error("Payment processing failed. Please try again.")
      console.error("Payment error:", error)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleCreateOrder = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method")
      return
    }

    if (paymentMethod === "cod") {
      await handleCODOrder()
    } else {
      setShowPaymentModal(true)
    }
  }

  const renderPaymentModal = () => {
    return (
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Total Amount: <span className="font-bold text-lg">PKR {(appliedRewards ? discountedTotal : originalTotal).toLocaleString()}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {paymentMethod === "easypaisa" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <Wallet className="h-5 w-5" />
                  <span className="font-semibold">Easypaisa / JazzCash Payment</span>
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="03XXXXXXXXX"
                    value={paymentDetails.phoneNumber || ""}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, phoneNumber: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">You will receive a payment request on this number</p>
                </div>
              </div>
            )}

            {paymentMethod === "bank" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-600">
                  <Building className="h-5 w-5" />
                  <span className="font-semibold">Bank Transfer Details</span>
                </div>
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="e.g., HBL, UBL, MCB"
                    value={paymentDetails.bankName || ""}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input
                    id="accountHolderName"
                    placeholder="As per bank account"
                    value={paymentDetails.accountHolderName || ""}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, accountHolderName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    type="text"
                    placeholder="Your bank account number"
                    value={paymentDetails.accountNumber || ""}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div className="bg-yellow-50 p-3 rounded-lg mt-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Your payment will be processed securely.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              disabled={isProcessingPayment}
              className="flex-1 bg-[#6E391D] hover:bg-[#542D18]"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${(appliedRewards ? discountedTotal : originalTotal).toLocaleString()} PKR`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (loading) {
    return (
      <div className="w-full md:w-2/3 lg:w-3/4 xl:w-2/3 flex flex-col items-center justify-center px-4 py-16 bg-white/90 rounded-xl shadow-sm">
        <Loader2 className="w-12 h-12 animate-spin text-[#6E391D] mb-4" />
        <p className="text-[#6E391D] font-medium">Loading your cart...</p>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="w-full md:w-2/3 lg:w-3/4 xl:w-2/3 flex flex-col items-center justify-center px-4 py-16 bg-white/90 rounded-xl shadow-sm">
        <h1 className="text-2xl md:text-4xl font-serif font-bold mb-8 tracking-wide">SHOPPING CART</h1>
        <ShoppingCart className="w-16 h-16 md:w-24 md:h-24 mb-6 text-[#6E391D]" />
        <h2 className="text-xl md:text-3xl font-serif mb-4">Your cart is empty!</h2>
        <Link href="/" className="px-6 py-3 bg-[#6E391D] text-white rounded-xl hover:bg-[#542D18]">
          Return To Shop
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full md:w-2/3 lg:w-3/4 xl:w-2/3 flex flex-col px-4 py-8 bg-white/90 rounded-xl shadow-sm">
      <h1 className="text-2xl md:text-4xl font-serif font-bold mb-8 text-center tracking-wide">SHOPPING CART</h1>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="py-4 px-2 text-left font-medium text-gray-600">Product</th>
              <th className="py-4 px-2 text-left font-medium text-gray-600 hidden md:table-cell">Type</th>
              <th className="py-4 px-2 text-left font-medium text-gray-600">Price</th>
              <th className="py-4 px-2 text-center font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item) => (
              <tr key={item._id} className="border-b border-gray-200">
                <td className="py-4 px-2">
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 md:h-20 md:w-20 flex-shrink-0 rounded-md overflow-hidden">
                      <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm md:text-base">{item.title}</h3>
                      <p className="text-xs md:text-sm text-gray-500">Size: {item.size}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-2 hidden md:table-cell">
                  <span className="text-sm">{item.productListing}</span>
                </td>
                <td className="py-4 px-2">
                  <span className="font-medium">PKR {item.price.toLocaleString()}</span>
                </td>
                <td className="py-4 px-2 text-center">
                  <button onClick={() => removeFromCart(item._id)} disabled={removingId === item._id}>
                    {removingId === item._id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="h-5 w-5 text-red-500 hover:text-red-700" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-lg font-medium">Total:</span>
          {appliedRewards ? (
            <div className="flex flex-col items-end">
              <span className="text-lg line-through text-gray-500">PKR {originalTotal.toLocaleString()}</span>
              <span className="text-xl font-bold text-green-600">PKR {discountedTotal.toLocaleString()}</span>
              <span className="text-xs text-green-600">
                Saved: PKR {(originalTotal - discountedTotal).toLocaleString()}
              </span>
            </div>
          ) : (
            <span className="text-xl font-bold">PKR {originalTotal.toLocaleString()}</span>
          )}
        </div>

        {rewards > 0 && !appliedRewards && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <Gift className="h-5 w-5 text-green-600 mr-2" />
              <span>You have {rewards} rewards available! (Each reward = PKR 100)</span>
            </div>
            <Button 
              onClick={applyRewards} 
              className="bg-green-600 hover:bg-green-700"
            >
              Apply Rewards
            </Button>
          </div>
        )}

        {appliedRewards && (
          <div className="mb-4">
            <Button 
              onClick={cancelRewards} 
              variant="outline" 
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Remove Rewards
            </Button>
          </div>
        )}

        {!showPaymentSection ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Link href="/" className="px-6 py-3 border border-[#6E391D] text-[#6E391D] rounded-xl text-center hover:bg-[#6E391D]/10">
              Continue Shopping
            </Link>
            <Button onClick={() => setShowPaymentSection(true)} className="bg-[#6E391D] hover:bg-[#542D18]">
              Proceed to Payment
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-6 mb-6 p-6 bg-gray-50 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">Select Payment Method</h3>
              
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                <div 
                  className={cn(
                    "flex items-center space-x-3 p-4 rounded-xl border cursor-pointer",
                    paymentMethod === "cod" && "bg-[#FAF4EF] border-[#6E391D]"
                  )}
                  onClick={() => setPaymentMethod("cod")}
                >
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex-1 cursor-pointer">
                    <div>
                      <span className="font-medium">Cash On Delivery</span>
                      <p className="text-sm text-gray-500">Pay when you receive your order</p>
                    </div>
                  </Label>
                </div>

                <div 
                  className={cn(
                    "flex items-center space-x-3 p-4 rounded-xl border cursor-pointer",
                    paymentMethod === "easypaisa" && "bg-[#FAF4EF] border-[#6E391D]"
                  )}
                  onClick={() => setPaymentMethod("easypaisa")}
                >
                  <RadioGroupItem value="easypaisa" id="easypaisa" />
                  <Label htmlFor="easypaisa" className="flex-1 cursor-pointer">
                    <div>
                      <span className="font-medium">EasyPaisa / JazzCash</span>
                      <p className="text-sm text-gray-500">Pay instantly via mobile wallet</p>
                    </div>
                  </Label>
                </div>

                <div 
                  className={cn(
                    "flex items-center space-x-3 p-4 rounded-xl border cursor-pointer",
                    paymentMethod === "bank" && "bg-[#FAF4EF] border-[#6E391D]"
                  )}
                  onClick={() => setPaymentMethod("bank")}
                >
                  <RadioGroupItem value="bank" id="bank" />
                  <Label htmlFor="bank" className="flex-1 cursor-pointer">
                    <div>
                      <span className="font-medium">Bank Transfer</span>
                      <p className="text-sm text-gray-500">Direct bank transfer</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <Button onClick={() => setShowPaymentSection(false)} variant="outline">
                Back to Cart
              </Button>
              <Button onClick={handleCreateOrder} disabled={orderLoading} className="bg-[#6E391D] hover:bg-[#542D18]">
                {orderLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${(appliedRewards ? discountedTotal : originalTotal).toLocaleString()} PKR`
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      {renderPaymentModal()}
    </div>
  )
}