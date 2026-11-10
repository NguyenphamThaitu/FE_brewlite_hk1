\# Detailed Use Case: Place Order and Make Payment



\## 1. Use Case Information



| Item | Description |

|---|---|

| Use Case ID | UC-01 |

| Use Case Name | Place Order and Make Payment |

| Primary Actor | Customer |

| Supporting Actor | Payment Gateway |

| Goal | Allow the customer to create an order and complete payment successfully. |

| Priority | Must Have |



\## 2. Preconditions



\- The customer has successfully logged in.

\- The system is operating normally.

\- The customer has at least one product in the cart.



\## 3. Postconditions



\### Success

\- The order is saved in the database.

\- The product inventory is updated.

\- The payment is recorded as SUCCESS.

\- The order status is updated to PAID.

\- The customer receives order confirmation.



\### Failure

\- The payment is recorded as FAILED.

\- The order status is updated to PAYMENT\_FAILED.

\- The customer's cart is retained.

\- The customer can retry the payment.



\## 4. Main Success Scenario



1\. The customer confirms the items in the cart.

2\. The system validates the cart and checks product availability.

3\. The system calculates the order total on the backend.

4\. The system creates the order with status PENDING.

5\. The system deducts the ordered quantities from product inventory within a database transaction.

6\. The customer selects a payment method (E\_WALLET or BANK\_CARD).

7\. The customer confirms the payment.

8\. The system sends the payment request to the Payment Gateway.

9\. The Payment Gateway returns a successful payment result.

10\. The system records the payment status as SUCCESS.

11\. The system updates the order status to PAID.

12\. The system displays the order confirmation to the customer.



\## 5. Alternative and Exception Flows



\### A1. Cart is empty

\- At step 1, the system detects that the cart is empty.

\- The system displays an error message.

\- The customer is asked to add products before placing an order.



\### A2. Product is out of stock

\- At step 2, the system detects insufficient stock.

\- The system cancels the order creation transaction.

\- The system displays an insufficient stock message.

\- The customer updates the cart.



\### A3. Payment fails

\- At step 9, the Payment Gateway returns a failed result.

\- The system records the payment status as FAILED.

\- The system updates the order status to PAYMENT\_FAILED.

\- The system informs the customer that payment failed.

\- The customer's cart is retained.

\- The customer can retry the payment.



\### A4. Duplicate payment request

\- The customer submits the same payment request again with the same Idempotency-Key.

\- The system checks the Idempotency-Key.

\- The system returns the previous payment result without processing another charge.



\## 6. Business Rules



\- Only authenticated customers can place orders.

\- The order total must be calculated by the backend.

\- Customers can only pay for their own orders.

\- Only orders with status PENDING or PAYMENT\_FAILED can be paid.

\- The system must prevent duplicate payment processing through the Idempotency-Key.



\## 7. Related Functional Requirements



\- FR-05: Create Order

\- FR-06: Cashless Payment

