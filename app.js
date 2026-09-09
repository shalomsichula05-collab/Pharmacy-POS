let cart = [];

let selectedCustomer = null;

function showSection(sectionId) {

    document
        .querySelectorAll(".section")
        .forEach(section => {

            section.classList.add("hidden");

        });


    document
        .getElementById(sectionId)
        .classList.remove("hidden");
}


const productSearch =
    document.getElementById(
        "productSearch"
    );


productSearch.addEventListener(
    "input",
    async event => {

        const q =
            event.target.value.trim();


        if (!q) {

            document.getElementById(
                "productResults"
            ).innerHTML = "";

            return;
        }


        try {

            const response =
                await fetch(
                    `/api/products/search?q=${encodeURIComponent(q)}`,
                    {
                        credentials:
                            "include"
                    }
                );


            if (
                response.status === 401
            ) {

                window.location.href =
                    "/login.html";

                return;
            }


            const products =
                await response.json();


            displayProducts(
                products
            );

        } catch (error) {

            console.error(error);
        }
    }
);


function displayProducts(products) {

    const container =
        document.getElementById(
            "productResults"
        );


    container.innerHTML = "";


    products.forEach(product => {

        const div =
            document.createElement(
                "div"
            );


        div.className =
            "search-result";


        div.innerHTML = `

            <strong>
                ${escapeHtml(
                    product.ProductName
                )}
            </strong>


            <span>
                Price:
                ${Number(
                    product.SellingPrice
                ).toFixed(2)}
            </span>

            <span>
                Stock:
                ${product.Stock}
            </span>

            ${
                product.PrescriptionRequired
                    ? `<strong class="warning">
                        Prescription required
                       </strong>`
                    : ""
            }
        `;


        div.onclick = () => {

            addToCart(product);


            container.innerHTML = "";


            productSearch.value = "";
        };


        container.appendChild(div);
    });
}


function addToCart(product) {

    if (
        Number(product.Stock) <= 0
    ) {

        alert(
            "This product is out of stock."
        );

        return;
    }


    const existing =
        cart.find(
            item =>
                item.productId ===
                product.ProductID
        );


    if (existing) {

        if (
            existing.quantity >=
            Number(product.Stock)
        ) {

            alert(
                "Not enough stock."
            );

            return;
        }


        existing.quantity++;

    } else {

        cart.push({

            productId:
                product.ProductID,

            name:
                product.ProductName,

            price:
                Number(
                    product.SellingPrice
                ),

            quantity: 1,

            stock:
                Number(product.Stock),

            prescriptionRequired:
                Boolean(
                    product.PrescriptionRequired
                )
        });
    }


    renderCart();
}


function renderCart() {

    const tbody =
        document.getElementById(
            "cart"
        );


    tbody.innerHTML = "";


    let total = 0;


    cart.forEach(
        (item, index) => {

            const itemTotal =
                item.price *
                item.quantity;


            total += itemTotal;


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHtml(
                        item.name
                    )}

                    ${
                        item.prescriptionRequired
                            ? `<small class="warning">
                                Prescription required
                               </small>`
                            : ""
                    }
                </td>

                <td>
                    ${item.price.toFixed(2)}
                </td>

                <td>

                    <input
                        type="number"
                        min="1"
                        max="${item.stock}"
                        value="${item.quantity}"
                        onchange="
                            updateQuantity(
                                ${index},
                                this.value
                            )
                        "
                    >

                </td>

                <td>
                    ${itemTotal.toFixed(2)}
                </td>

                <td>

                    <button
                        class="danger"
                        onclick="
                            removeFromCart(
                                ${index}
                            )
                        ">

                        Remove

                    </button>

                </td>
            `;


            tbody.appendChild(row);
        }
    );


    document.getElementById(
        "saleTotal"
    ).textContent =
        total.toFixed(2);
}


function updateQuantity(
    index,
    value
) {

    const quantity =
        Number(value);


    if (
        quantity < 1 ||
        quantity >
            cart[index].stock
    ) {

        alert(
            "Invalid quantity."
        );

        renderCart();

        return;
    }


    cart[index].quantity =
        quantity;


    renderCart();
}


function removeFromCart(index) {

    cart.splice(
        index,
        1
    );


    renderCart();
}

const customerSearch =
    document.getElementById(
        "customerSearch"
    );


customerSearch.addEventListener(
    "input",
    async event => {

        const q =
            event.target.value.trim();


        if (!q) return;


        const response =
            await fetch(
                `/api/customers/search?q=${encodeURIComponent(q)}`,
                {
                    credentials:
                        "include"
                }
            );


        if (
            response.status === 401
        ) {

            window.location.href =
                "/login.html";

            return;
        }


        const customers =
            await response.json();


        displayCustomerResults(
            customers
        );
    }
);


function displayCustomerResults(
    customers
) {

    const container =
        document.getElementById(
            "customerResults"
        );


    container.innerHTML = "";


    customers.forEach(customer => {

        const div =
            document.createElement(
                "div"
            );


        div.className =
            "search-result";


        div.innerHTML = `

            <strong>
                ${escapeHtml(
                    customer.FirstName
                )}
                ${escapeHtml(
                    customer.LastName
                )}
            </strong>

            <span>
                Phone:
                ${escapeHtml(
                    customer.Phone || ""
                )}
            </span>

            <span>
                Customer #:
                ${escapeHtml(
                    customer.CustomerID
                )}
            </span>
        `;


        div.onclick = () => {

            selectedCustomer =
                customer;


            document.getElementById(
                "selectedCustomer"
            ).innerHTML = `

                <strong>
                    Selected customer:
                </strong>

                ${escapeHtml(
                    customer.FirstName
                )}
                ${escapeHtml(
                    customer.LastName
                )}

                <button
                    onclick="clearCustomer()">

                    Clear

                </button>
            `;


            container.innerHTML = "";


            customerSearch.value = "";
        };


        container.appendChild(
            div
        );
    });
}


function clearCustomer() {

    selectedCustomer =
        null;


    document.getElementById(
        "selectedCustomer"
    ).innerHTML = "";
}

async function completeSale() {

    if (
        cart.length === 0
    ) {

        alert(
            "The sale is empty."
        );

        return;
    }

    const response =
        await fetch(
            "/api/sales",
            {

                method: "POST",

                credentials:
                    "include",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({

                        customerId:
                            selectedCustomer
                                ?.CustomerID ||
                            null,

                        items:
                            cart.map(item => ({
                                productId:
                                    item.productId,

                                quantity:
                                    item.quantity
                            })),

                        paymentMethod:
                            document
                                .getElementById(
                                    "paymentMethod"
                                )
                                .value,

                        tax: 0,

                        discount: 0
                    })
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        alert(
            data.message
        );

        return;
    }


    alert(
        `Sale completed.\n\nReceipt: ${data.receiptNumber}\nTotal: ${Number(data.total).toFixed(2)}`
    );


    cart = [];

    selectedCustomer =
        null;


    document.getElementById(
        "selectedCustomer"
    ).innerHTML = "";


    renderCart();
}

function cancelSale() {

    if (
        cart.length === 0
    ) {
        return;
    }


    if (
        confirm(
            "Cancel this sale?"
        )
    ) {

        cart = [];

        selectedCustomer =
            null;


        document.getElementById(
            "selectedCustomer"
        ).innerHTML = "";


        renderCart();
    }
}

function pauseSale() {

    if (
        cart.length === 0
    ) {

        alert(
            "There is no sale to pause."
        );

        return;
    }


    alert(
        "Paused-sale storage will be connected to SQL Server next."
    );
}

async function searchCustomers() {

    const q =
        document.getElementById(
            "customerLookup"
        ).value;


    const response =
        await fetch(
            `/api/customers/search?q=${encodeURIComponent(q)}`,
            {
                credentials:
                    "include"
            }
        );


    const customers =
        await response.json();


    const container =
        document.getElementById(
            "customersList"
        );


    container.innerHTML = "";


    customers.forEach(customer => {

        const div =
            document.createElement(
                "div"
            );


        div.className =
            "customer-card";


        div.innerHTML = `

            <strong>
                ${escapeHtml(
                    customer.FirstName
                )}
                ${escapeHtml(
                    customer.LastName
                )}
            </strong>

            <br>

            Customer #:
            ${escapeHtml(
                customer.CustomerID
            )}

            <br>

            Phone:
            ${escapeHtml(
                customer.Phone || ""
            )}

            <br>

            Email:
            ${escapeHtml(
                customer.Email || ""
            )}
        `;


        container.appendChild(
            div
        );
    });
}

async function loadExpiredStock() {

    const response =
        await fetch(
            "/api/inventory/expired",
            {
                credentials:
                    "include"
            }
        );


    const items =
        await response.json();


    const container =
        document.getElementById(
            "expiredList"
        );


    container.innerHTML = "";


    items.forEach(item => {

        const div =
            document.createElement(
                "div"
            );


        div.className =
            "expired-item";


        div.innerHTML = `

            <strong>
                ${escapeHtml(
                    item.ProductName
                )}
            </strong>

            <br>

            Batch:
            ${escapeHtml(
                item.BatchNumber || ""
            )}

            <br>

            Quantity:
            ${item.Quantity}

            <br>

            Expiry:
            ${item.ExpiryDate}

            <br><br>

            <button
                onclick="
                    removeExpiredStock(
                        ${item.InventoryID}
                    )
                ">

                Remove From Stock

            </button>
        `;


        container.appendChild(
            div
        );
    });
}


async function removeExpiredStock(
    inventoryId
) {

    if (
        !confirm(
            "Remove this expired stock from inventory?"
        )
    ) {
        return;
    }


    const response =
        await fetch(
            `/api/inventory/${inventoryId}/expire`,
            {
                method: "POST",

                credentials:
                    "include"
            }
        );


    const data =
        await response.json();


    alert(
        data.message
    );


    loadExpiredStock();
}

document
    .getElementById(
        "inventoryForm"
    )
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const body = {

                productId:
                    Number(
                        document
                            .getElementById(
                                "inventoryProduct"
                            )
                            .value
                    ),

                batchNumber:
                    document
                        .getElementById(
                            "batchNumber"
                        )
                        .value,

                quantity:
                    Number(
                        document
                            .getElementById(
                                "quantity"
                            )
                            .value
                    ),

                expiryDate:
                    document
                        .getElementById(
                            "expiryDate"
                        )
                        .value || null,

                costPrice:
                    Number(
                        document
                            .getElementById(
                                "costPrice"
                            )
                            .value
                    ) || 0,

                supplier:
                    document
                        .getElementById(
                            "supplier"
                        )
                        .value
            };


            const response =
                await fetch(
                    "/api/inventory",
                    {

                        method: "POST",

                        credentials:
                            "include",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(body)
                    }
                );


            const data =
                await response.json();


            alert(
                data.message
            );


            if (
                response.ok
            ) {

                event.target.reset();
            }
        }
    );




document
    .getElementById(
        "logoutButton"
    )
    .addEventListener(
        "click",
        async () => {

            await fetch(
                "/api/auth/logout",
                {
                    method: "POST",

                    credentials:
                        "include"
                }
            );


            window.location.href =
                "/login.html";
        }
    );

function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}

const pharmacistForm =
    document.getElementById("pharmacistForm");

if (pharmacistForm) {
    pharmacistForm.addEventListener("submit", async event => {
        event.preventDefault();

        const message = document.getElementById("pharmacistMessage");

        const response = await fetch(
            "/api/auth/pharmacists",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    username:
                        document.getElementById(
                            "pharmacistUsername"
                        ).value.trim(),

                    password:
                        document.getElementById(
                            "pharmacistPassword"
                        ).value,

                    firstName:
                        document.getElementById(
                            "pharmacistFirstName"
                        ).value.trim(),

                    lastName:
                        document.getElementById(
                            "pharmacistLastName"
                        ).value.trim(),

                    role:
                        document.getElementById(
                            "pharmacistRole"
                        ).value
                })
            }
        );

        const data = await response.json();

        message.textContent =
            data.message || "Unable to create pharmacist";

        if (response.ok) {
            pharmacistForm.reset();
        }
    });
}

async function loadPrescriptionHistory() {
    const customerId = document
        .getElementById("prescriptionCustomerId")
        .value
        .trim();

    const container =
        document.getElementById("prescriptionList");

    if (!customerId) {
        container.textContent = "Enter a customer ID.";
        return;
    }

    try {
        const response = await fetch(
            `/api/prescriptions/customer/${encodeURIComponent(customerId)}`,
            {
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            container.textContent =
                data.message || "Unable to load prescriptions.";
            return;
        }

        container.innerHTML = "";

        if (data.length === 0) {
            container.textContent =
                "No prescriptions found for this customer.";
            return;
        }

        data.forEach(prescription => {
            const div = document.createElement("div");
            div.className = "prescription-card";

            div.innerHTML = `
                <strong>
                    ${escapeHtml(prescription.Medication)}
                </strong>
                <p>
                    Prescriber:
                    ${escapeHtml(
                        prescription.PrescriberName || "Not provided"
                    )}
                </p>
                <p>
                    Date:
                    ${escapeHtml(
                        prescription.PrescriptionDate || "Not provided"
                    )}
                </p>
                <p>
                    Dosage:
                    ${escapeHtml(
                        prescription.Dosage || "Not provided"
                    )}
                </p>
                <p>
                    Expiry:
                    ${escapeHtml(
                        prescription.ExpiryDate || "Not provided"
                    )}
                </p>
            `;

            container.appendChild(div);
        });
    } catch (error) {
        console.error(error);
        container.textContent =
            "Unable to connect to the server.";
    }
}
