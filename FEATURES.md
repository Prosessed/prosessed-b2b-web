# B2B E-Commerce Platform - Feature Guide

## 🔐 Authentication & Account Management

### Login & Company Selection
- Navigate to `/login`
- Enter your email to fetch associated companies
- Select your business entity
- Enter your password to sign in
- User data is cached in secure HTTP-only cookies

### Forgot Password (OTP-Based)
- From the password page, click "Forgot password?"
- Navigate to `/login/forgot-password`
- **Step 1:** Enter your email
- **Step 2:** Verify 6-digit OTP sent to your inbox
- **Step 3:** Create new password and confirm
- Account is immediately secured with new password

### My Account
- Navigate to `/account` (requires login)
- View profile information and company details
- See real-time statistics:
  - Total Orders (from quotations)
  - Total Spending
  - Saved addresses
  - Payment methods
- Edit personal information
- Manage addresses, payment methods, and settings
- One-click logout

---

## 🛍️ Product Browsing & Search

### Browse Products
- Navigate to `/products`
- Browse by category using the sidebar
- See all products with pricing and availability
- Filter by brand, price range, or stock status
- Sort by relevance, price, or quantity

### Product Tags
Products can be marked with special badges:

- 🔥 **Hot Deal** - Featured promotional items (animated)
- ⭐ **Best Seller** - Most popular products
- ✨ **New** - Recently added products
- ⏰ **Limited** - Limited availability items
- **Discount** - Shows percentage off in green badge

### Search
- Use the search bar in the navigation
- Search for products by name, brand, or category
- Real-time search suggestions
- Minimum 2 characters to trigger search

### Product Details
- Click any product to view full details
- See images, pricing, stock status
- Add to cart directly from product page
- View related products

---

## 🛒 Shopping Cart

### Add to Cart
- Click "ADD" button on any product card
- Cart badge updates automatically in header
- Quick cart access via shopping cart icon

### Cart Management
- Click shopping cart icon to open drawer
- View all items with prices
- Adjust quantities with +/- buttons
- Remove individual items
- Clear entire cart (with confirmation)

### Cart Page
- Navigate to `/cart` for detailed view
- See itemized breakdown
- Calculate subtotal, tax, and total
- Edit quantities and remove items
- Add special order notes
- Submit quotation for order processing

### Cart Synchronization
- Real-time sync with backend
- Automatic price updates
- Inventory awareness
- Multi-session sync

---

## 📋 Quotations & Orders

### My Orders
- Navigate to `/orders`
- See all your quotations/orders
- Filter by status (Draft, Submitted, Cancelled)
- View order totals and item counts
- Quick links to order details

### Order Status
Orders can have the following statuses:
- **Draft** - Not yet submitted (yellow badge)
- **Submitted** - Awaiting processing (blue badge)
- **Cancelled** - Cancelled by user (red badge)

### Order Details
- Click any order to view full details
- See all items, prices, and quantities
- View payment terms and currency
- Track order status and history
- Reorder items from previous orders

### Create Quotation
1. Add products to cart
2. Navigate to `/cart`
3. Review items and pricing
4. Click "Submit Quotation"
5. Confirmation and redirect to My Orders

---

## 📊 Analytics & Statistics

### Account Dashboard
Real-time statistics available on `/account`:
- **Total Orders:** Count of all submitted quotations
- **Total Spent:** Sum of all order amounts
- **Favorites:** Saved/wishlist items
- **Addresses:** Number of saved delivery addresses

### Order Analytics
- Track spending trends
- Monitor order frequency
- Analyze product preferences

---

## ⚙️ Settings & Preferences

### Account Settings
Access from `/account` → Settings tab:

**Notifications**
- Order updates
- Promotional offers
- Newsletter subscription
- Price alerts

**Security**
- Change password
- Enable two-factor authentication
- View login history

**Addresses**
- Add new delivery addresses
- Set default address
- Edit existing addresses
- Remove addresses

**Payment Methods**
- Save credit/debit cards
- Manage payment information
- Set default payment method

---

## 🔄 Data Synchronization

### Real-Time Updates
- Cart updates sync instantly with backend
- Order status changes appear immediately
- Product availability updates in real-time
- Quote submissions process asynchronously

### Caching Strategy
- SWR provides automatic data caching
- Background revalidation for freshness
- Manual refresh available via UI
- Smart deduplication of requests

---

## 🎯 Quick Actions

### From Navigation Bar
- **Logo:** Go to home page
- **Search:** Find products (real-time suggestions)
- **Cart:** View/manage shopping cart
- **Theme:** Toggle dark/light mode
- **Account:** Access user menu with logout

### Keyboard Shortcuts
- `Escape` - Close modals and dropdowns
- `Enter` - Submit forms and search
- Tab navigation for accessibility

---

## 📱 Mobile Experience

### Responsive Design
- Full functionality on mobile devices
- Touch-optimized buttons and inputs
- Mobile-friendly navigation
- Optimized images for mobile

### Mobile-Specific Features
- Simplified cart drawer
- Mobile-friendly product grid
- Touch gestures for navigation
- Bottom sheet for filters

---

## 🚀 Performance Features

### Fast Loading
- Image optimization
- Code splitting and lazy loading
- Efficient caching
- Optimized API calls

### Smooth Interactions
- Animated transitions
- Loading skeletons
- Instant feedback
- Smooth scrolling

---

## 🔒 Security Features

### Session Management
- HTTP-only cookie storage
- Automatic session validation
- Secure logout with cleanup
- CSRF protection

### Data Protection
- HTTPS for all communications
- Encrypted passwords
- Secure API authentication
- Session timeout protection

### Password Reset
- OTP-based verification
- One-time token usage
- Time-limited tokens
- Secure password hashing

---

## ❓ Frequently Asked Questions

**Q: How do I reset my password?**
A: Click "Forgot password?" on the login page, verify via OTP sent to your email, and set a new password.

**Q: Can I modify an order after submission?**
A: Orders in "Draft" status can be modified. Once submitted, create a new quotation for changes.

**Q: How long does my session last?**
A: Sessions remain active until you logout or the session expires (typically 24-48 hours).

**Q: Can I use multiple addresses?**
A: Yes, you can save multiple addresses and select one during checkout.

**Q: Are my payment details saved securely?**
A: Yes, payment data is encrypted and stored securely with PCI compliance.

**Q: How do I get notified about order status?**
A: Enable order notifications in Account → Settings → Notifications.

---

## 🐛 Troubleshooting

### Login Issues
- Verify email is correct
- Check for typos in password
- Clear browser cookies and try again
- Try a different browser

### Cart Problems
- Refresh the page
- Clear browser cache
- Remove and re-add items
- Check internet connection

### Payment Issues
- Verify card details
- Check card has sufficient funds
- Ensure security codes match
- Contact support if persistent

### Search Not Working
- Enter at least 2 characters
- Check internet connection
- Try different search terms
- Clear search history

---

## 📞 Customer Support

For issues not covered here:
- Email: support@prosessed.ai
- Live chat available during business hours
- Knowledge base: docs.prosessed.ai
- Twitter: @ProcessedAI

---

## 🎓 Getting Started Guide

### First Time Using the Platform?

1. **Sign Up**
   - Create account with your business email
   - Verify your company details
   - Set initial password

2. **Complete Profile**
   - Add company information
   - Set default warehouse and payment terms
   - Upload company logo

3. **Browse Products**
   - Explore categories
   - Use search to find items
   - Add favorite items to cart

4. **Place First Order**
   - Add items to cart
   - Review pricing and totals
   - Submit quotation
   - Wait for confirmation

5. **Manage Account**
   - View order history
   - Update preferences
   - Manage addresses and payments

---

## 📈 Pro Tips

- Use saved addresses for faster checkout
- Enable notifications for order updates
- Save frequently ordered products as favorites
- Use the search bar for quick product lookup
- Check deals section for special offers
- Set up two-factor authentication for security
- Review past orders to reorder items
- Export quotations for record keeping

---

**Version:** 1.0.0  
**Last Updated:** 2025-02-10  
**Documentation:** See ARCHITECTURE.md and IMPLEMENTATION_SUMMARY.md for technical details
