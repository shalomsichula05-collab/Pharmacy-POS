CREATE TABLE Pharmacist(
    PharmacistID INT IDENTITY(1,3) PRIMARY KEY,
    Username NVARCHAR(20) NOT NULL UNIQUE,
    Password NVARCHAR(20) NOT NULL,
    PFirstName NVARCHAR(20) NOT NULL,
    PLastName NVARCHAR(20) NOT NULL,
    Role NVARCHAR(30) NOT NULL
        CONSTRAINT CK_Pharmacists_Role
        CHECK (Role IN ('pharmacist', 'admin')),
    Active BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL
        DEFAULT SYSDATETIME()
);
GO

CREATE TABLE Customers(
    CustomerID INT IDENTITY(1,5) PRIMARY KEY,
    FirstName NVARCHAR(20) NOT NULL,
    LastName NVARCHAR(20) NOT NULL,
    Phone NVARCHAR(20),
    DateOfBirth DATE,
    CreatedAt DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NOT NULL
        DEFAULT SYSDATETIME()
);
GO

CREATE TABLE Products(
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    ProductName NVARCHAR(50) NOT NULL,
    Category NVARCHAR(50),
    PrescriptionRequired BIT NOT NULL DEFAULT 0,
    SellingPrice DECIMAL(18,2) NOT NULL,
    Active BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL
        DEFAULT SYSDATETIME()
);
GO

CREATE TABLE Inventory(
    InventoryID INT IDENTITY(1,2) PRIMARY KEY,
    ProductID INT NOT NULL,
    BatchNumber NVARCHAR(50),
    Quantity INT NOT NULL DEFAULT 0,
    ExpiryDate DATE,
    CostPrice DECIMAL(18,2) NOT NULL DEFAULT 0,
    Supplier NVARCHAR(50),
    CreatedAt DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Inventory_Product
        FOREIGN KEY(ProductID)
        REFERENCES Products(ProductID),
    CONSTRAINT CK_Inventory_Quantity
        CHECK (Quantity >= 0)
);
GO

CREATE TABLE Prescriptions(
    PrescriptionID INT IDENTITY(1,2) PRIMARY KEY,
    CustomerID INT NOT NULL,
    PrescriberName NVARCHAR(50),
    PrescriptionDate DATE,
    Medication NVARCHAR(50) NOT NULL,
    Dosage NVARCHAR(50),
    CreatedAt DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Prescriptions_Customer
        FOREIGN KEY(CustomerID)
        REFERENCES Customers(CustomerID),
);
GO

CREATE TABLE Sales(
    SaleID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT NULL,
    PharmacistID INT NOT NULL,
    Total DECIMAL(18,2) NOT NULL,
    PaymentMethod NVARCHAR(30) NOT NULL,
    Status NVARCHAR(30) NOT NULL DEFAULT 'completed',
    CreatedAt DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Sales_Customer
        FOREIGN KEY(CustomerID)
        REFERENCES Customers(CustomerID),

    CONSTRAINT FK_Sales_Pharmacist
        FOREIGN KEY(PharmacistID)
        REFERENCES Pharmacist(PharmacistID),
    CONSTRAINT CK_Sales_PaymentMethod
        CHECK
        (
            PaymentMethod IN
            (
                'cash',
                'card',
                'mobile_money',
                'insurance'
            )
        ),

    CONSTRAINT CK_Sales_Status
        CHECK
        (
            Status IN
            (
                'completed',
                'cancelled',
                'refunded'
            )
        )
);
GO


CREATE TABLE SaleItems
(
    SaleItemID INT IDENTITY(1,1) PRIMARY KEY,
    SaleID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    Total DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_SaleItems_Sale
        FOREIGN KEY(SaleID)
        REFERENCES Sales(SaleID),
    CONSTRAINT FK_SaleItems_Product
        FOREIGN KEY(ProductID)
        REFERENCES Products(ProductID)
);
GO

CREATE TABLE PausedSales
(
    PausedSaleID INT IDENTITY(1,1) PRIMARY KEY,
    PharmacistID INT NOT NULL,
    CustomerID INT NULL,
    SaleData NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),
    CONSTRAINT FK_PausedSales_Pharmacist
        FOREIGN KEY(PharmacistID)
        REFERENCES Pharmacist(PharmacistID),
    CONSTRAINT FK_PausedSales_Customer
        FOREIGN KEY(CustomerID)
        REFERENCES Customers(CustomerID)
);
GO

CREATE TABLE InventoryTransactions
(InventoryTransactionID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    InventoryID INT NULL,
    PharmacistID INT NOT NULL,
    TransactionType NVARCHAR(30) NOT NULL,
    Quantity INT NOT NULL,
    Notes NVARCHAR(500),
    CreatedAt DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),
    CONSTRAINT FK_InventoryTransactions_Product
        FOREIGN KEY(ProductID)
        REFERENCES Products(ProductID),
    CONSTRAINT FK_InventoryTransactions_Inventory
        FOREIGN KEY(InventoryID)
        REFERENCES Inventory(InventoryID),
    CONSTRAINT FK_InventoryTransactions_Pharmacist
        FOREIGN KEY(PharmacistID)
        REFERENCES Pharmacist(PharmacistID),
    CONSTRAINT CK_InventoryTransactions_Type
        CHECK
        (
            TransactionType IN
            (
                'stock_in',
                'sale',
                'adjustment',
                'expired',
                'damaged',
                'return'
            )
        )
);
GO

CREATE TABLE AuditLogs
(
    AuditLogID BIGINT IDENTITY(1,1) PRIMARY KEY,
    PharmacistID INT NULL,
    Action NVARCHAR(50) NOT NULL,
    EntityType NVARCHAR(50),
    EntityID INT,
    Details NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),
    CONSTRAINT FK_AuditLogs_Pharmacist
        FOREIGN KEY(PharmacistID)
        REFERENCES Pharmacist(PharmacistID)
);
GO

