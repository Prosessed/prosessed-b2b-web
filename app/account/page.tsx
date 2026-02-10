"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuotations, useCustomerDetails } from "@/lib/api/hooks"
import { clearAuthCookie } from "@/lib/auth/actions"
import { useAuth } from "@/lib/auth/context"
import { Bell, Building, Camera, CreditCard, Edit, Heart, LogOut, Mail, MapPin, Package, Shield, User, Phone, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AccountPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const { data: quotations = [] } = useQuotations()
  const { data: customerDetails, isLoading: customerLoading } = useCustomerDetails(user?.customerId ?? null)
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !user) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Building className="h-8 w-8 animate-pulse text-primary" />
      </div>
    )
  }

  const handleLogout = async () => {
    await clearAuthCookie()
    logout()
    router.push("/login")
  }

  const quotationsArray = Array.isArray(quotations) ? quotations : []
  const totalOrders = quotationsArray.length || 0
  const totalSpent = quotationsArray.reduce((sum: number, q: any) => sum + (q.total || 0), 0) || 0
  const c = customerDetails
  const initials = (user.fullName || user.email || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const addressList = Array.isArray(c?.address_list) ? c.address_list : []
  const contactList = Array.isArray(c?.contact_list) ? c.contact_list : []
  const topSelling = Array.isArray(c?.top_selling_items) ? c.top_selling_items : []

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Profile Header */}
        <Card className="mb-8 border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-primary/20">
                  <AvatarImage src="/placeholder.svg?height=128&width=128" alt="Profile" />
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                >
                  <Camera className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{c?.customer_name ?? user.fullName ?? user.email}</h1>
                  {user.isCustomer && <Badge className="bg-primary/10 text-primary border-primary/20">Customer</Badge>}
                </div>
                <p className="text-muted-foreground mb-4">Member ID: {user.customerId}</p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{c?.customer_email ?? user.email}</span>
                  </div>
                  {(c?.customer_phone || (contactList[0] as any)?.mobile_no) && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{c?.customer_phone ?? (contactList[0] as any)?.mobile_no}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{user.companyName || user.username}</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Building className="h-4 w-4" />
                    <span>{user.defaultWarehouse}</span>
                  </div>
                </div>
                {c?.payment_terms_template && (
                  <p className="text-sm text-muted-foreground mt-2">Payment terms: {c.payment_terms_template}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  className="border-primary/30 text-foreground hover:bg-primary/10 hover:text-foreground"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/orders">
            <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{c?.total_invoices ?? totalOrders}</div>
                <div className="text-sm text-muted-foreground">Invoices</div>
              </CardContent>
            </Card>
          </Link>
          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 text-center">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">
                {c?.total_outstanding != null ? (c.total_outstanding as number).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
              </div>
              <div className="text-sm text-muted-foreground">Outstanding</div>
            </CardContent>
          </Card>
          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{addressList.length || 0}</div>
              <div className="text-sm text-muted-foreground">Addresses</div>
            </CardContent>
          </Card>
          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-sm font-bold">
                {c?.last_order_date ? new Date(c.last_order_date).toLocaleDateString() : "—"}
              </div>
              <div className="text-sm text-muted-foreground">Last order</div>
            </CardContent>
          </Card>
        </div>

        {/* Account Details Tabs */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted/50">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="payment">Payment Methods</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your details and business information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" defaultValue={c?.customer_name ?? user.fullName ?? ""} disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={c?.customer_email ?? user.email ?? ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warehouse">Default Warehouse</Label>
                    <Input id="warehouse" defaultValue={user.defaultWarehouse} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" defaultValue={user.defaultCurrency} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerm">Default Payment Term</Label>
                    <Input id="paymentTerm" defaultValue={c?.payment_terms_template ?? user.defaultPaymentTerm} disabled />
                  </div>
                </div>
                {contactList.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Contacts</h4>
                    <div className="space-y-2">
                      {contactList.slice(0, 5).map((contact: any) => (
                        <div key={contact.name} className="text-sm text-muted-foreground">
                          {contact.full_name || contact.first_name} — {contact.email_id || contact.mobile_no || "—"}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {Array.isArray(c?.sales_persons_involved) && c.sales_persons_involved.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Sales person</h4>
                    <p className="text-sm text-muted-foreground">{c.sales_persons_involved.join(", ")}</p>
                  </div>
                )}
                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
                    <Button variant="outline" className="text-foreground hover:bg-accent hover:text-foreground bg-transparent" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            {topSelling.length > 0 && (
              <Card className="border-border/50 mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Top selling items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {topSelling.slice(0, 10).map((item: any) => (
                      <li key={item.item_code} className="flex justify-between text-sm">
                        <span>{item.item_name}</span>
                        <span className="text-muted-foreground">Qty: {item.total_qty} · {(item.total_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Saved Addresses
                </CardTitle>
                <CardDescription>Your billing and shipping addresses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : addressList.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No addresses on file</p>
                  ) : (
                    addressList.map((addr: any) => (
                      <div
                        key={addr.name}
                        className="flex items-start justify-between p-4 border border-border/50 rounded-lg hover:border-primary/50 transition-colors"
                      >
                        <div className="flex gap-3">
                          <MapPin className="h-5 w-5 text-primary mt-1 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{addr.address_type || "Address"}</span>
                              {addr.is_primary_address === 1 && (
                                <Badge variant="secondary" className="text-xs">Primary</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ""}</p>
                            <p className="text-sm text-muted-foreground">{[addr.city, addr.state, addr.pincode, addr.country].filter(Boolean).join(", ")}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
                <CardDescription>Manage your saved payment methods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: "Visa", last4: "4242", expiry: "12/25", isDefault: true },
                    { type: "Mastercard", last4: "8888", expiry: "08/26", isDefault: false },
                  ].map((card, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {card.type} •••• {card.last4}
                            </span>
                            {card.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">Expires {card.expiry}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-foreground hover:bg-accent hover:text-foreground"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full border-dashed border-primary/30 text-foreground hover:bg-primary/10 hover:text-foreground bg-transparent"
                  >
                    + Add New Card
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription>Manage your notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Order updates", description: "Get notified about your order status" },
                    { label: "Promotional offers", description: "Receive special deals and discounts" },
                    { label: "Newsletter", description: "Weekly updates about new products" },
                    { label: "Price alerts", description: "Get notified when prices drop" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                    >
                      <div>
                        <div className="font-medium mb-1">{item.label}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-foreground hover:bg-accent hover:text-foreground bg-transparent"
                      >
                        Enable
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security
                  </CardTitle>
                  <CardDescription>Manage your account security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <div>
                      <div className="font-medium mb-1">Change Password</div>
                      <div className="text-sm text-muted-foreground">Update your password regularly</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-foreground hover:bg-accent hover:text-foreground bg-transparent"
                    >
                      Change
                    </Button>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <div>
                      <div className="font-medium mb-1">Two-Factor Authentication</div>
                      <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-foreground hover:bg-accent hover:text-foreground bg-transparent"
                    >
                      Enable
                    </Button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium mb-1">Login History</div>
                      <div className="text-sm text-muted-foreground">View recent account activity</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-foreground hover:bg-accent hover:text-foreground bg-transparent"
                    >
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
