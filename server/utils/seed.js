const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Delivery = require("../models/Delivery");
const ProofOfDelivery = require("../models/ProofOfDelivery");

const seedDatabase = async () => {
    try {
        console.log("Connecting to MongoDB for seeding...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully.");

        console.log("Clearing existing data...");
        await Promise.all([
            User.deleteMany({}),
            Vehicle.deleteMany({}),
            Driver.deleteMany({}),
            Delivery.deleteMany({}),
            ProofOfDelivery.deleteMany({})
        ]);

        console.log("Creating default password hashes...");
        const defaultPassword = "Password@123";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        console.log("Seeding Users...");
        // 1. ADMIN
        const adminUser = await User.create({
            name: "Alex Administrator",
            email: "admin@fleetflow.com",
            password: hashedPassword,
            role: "ADMIN",
            phone: "+1-555-0100",
            isActive: true
        });

        // 2. DISPATCHER
        const dispatcherUser = await User.create({
            name: "Diana Dispatcher",
            email: "dispatcher@fleetflow.com",
            password: hashedPassword,
            role: "DISPATCHER",
            phone: "+1-555-0101",
            isActive: true
        });

        // 3. DRIVER 1
        const driverUser1 = await User.create({
            name: "David Driver",
            email: "driver1@fleetflow.com",
            password: hashedPassword,
            role: "DRIVER",
            phone: "+1-555-0102",
            isActive: true
        });

        // 4. DRIVER 2
        const driverUser2 = await User.create({
            name: "Danielle Driver",
            email: "driver2@fleetflow.com",
            password: hashedPassword,
            role: "DRIVER",
            phone: "+1-555-0103",
            isActive: true
        });

        console.log("Seeding Vehicles...");
        // Vehicle 1
        const vehicle1 = await Vehicle.create({
            vehicleNumber: "VAN-101",
            registrationNumber: "FL-VAN-2024-01",
            type: "VAN",
            make: "Mercedes-Benz",
            model: "Sprinter 2500",
            year: 2023,
            capacity: 1500,
            fuelType: "DIESEL",
            status: "ASSIGNED",
            currentLocation: {
                address: "Central Distribution Hub, Sector 4",
                lat: 40.7128,
                lng: -74.0060
            },
            isActive: true
        });

        // Vehicle 2
        const vehicle2 = await Vehicle.create({
            vehicleNumber: "TRK-202",
            registrationNumber: "FL-TRK-2024-02",
            type: "TRUCK",
            make: "Freightliner",
            model: "M2 106",
            year: 2022,
            capacity: 5000,
            fuelType: "DIESEL",
            status: "AVAILABLE",
            currentLocation: {
                address: "West Logistics Yard, Bay 12",
                lat: 40.7306,
                lng: -73.9352
            },
            isActive: true
        });

        console.log("Seeding Driver Profiles...");
        // Driver Profile 1 (Assigned to Vehicle 1, ON_TRIP)
        const driverProfile1 = await Driver.create({
            user: driverUser1._id,
            phone: driverUser1.phone,
            licenseNumber: "DL-NY-98765432",
            licenseExpiry: new Date("2028-12-31"),
            address: "124 Logistics Way, Queens, NY",
            emergencyContact: {
                name: "Sarah Driver",
                phone: "+1-555-0999",
                relationship: "Spouse"
            },
            availabilityStatus: "ON_TRIP",
            assignedVehicle: vehicle1._id
        });

        // Driver Profile 2 (Available)
        const driverProfile2 = await Driver.create({
            user: driverUser2._id,
            phone: driverUser2.phone,
            licenseNumber: "DL-NJ-12345678",
            licenseExpiry: new Date("2027-08-15"),
            address: "56 Delivery Ave, Jersey City, NJ",
            emergencyContact: {
                name: "Mark Driver",
                phone: "+1-555-0888",
                relationship: "Brother"
            },
            availabilityStatus: "AVAILABLE",
            assignedVehicle: null
        });

        console.log("Seeding Deliveries...");
        // Delivery 1: In Transit (Assigned to Driver 1 & Vehicle 1)
        const delivery1 = await Delivery.create({
            deliveryNumber: "DEL-2026-001",
            customerName: "TechCorp Logistics Inc.",
            customerPhone: "+1-555-3001",
            pickupAddress: "100 Warehouse Blvd, Long Island City, NY",
            deliveryAddress: "750 3rd Avenue, Manhattan, NY",
            pickupCoordinates: { lat: 40.7447, lng: -73.9485 },
            deliveryCoordinates: { lat: 40.7533, lng: -73.9742 },
            packageDescription: "Server rack hardware and networking equipment",
            packageWeight: 45,
            priority: "URGENT",
            scheduledDate: new Date(),
            status: "IN_TRANSIT",
            assignedDriver: driverUser1._id,
            assignedVehicle: vehicle1._id,
            dispatcher: dispatcherUser._id,
            notes: "Handle with extreme care, fragile electronics."
        });

        // Delivery 2: Pending (Awaiting assignment)
        const delivery2 = await Delivery.create({
            deliveryNumber: "DEL-2026-002",
            customerName: "Apex Medical Supplies",
            customerPhone: "+1-555-3002",
            pickupAddress: "45 Port Road, Elizabeth, NJ",
            deliveryAddress: "1200 Hospital Way, Brooklyn, NY",
            pickupCoordinates: { lat: 40.6639, lng: -74.2107 },
            deliveryCoordinates: { lat: 40.6500, lng: -73.9496 },
            packageDescription: "Temperature-controlled pharmaceuticals",
            packageWeight: 15,
            priority: "HIGH",
            scheduledDate: new Date(),
            status: "PENDING",
            assignedDriver: null,
            assignedVehicle: null,
            dispatcher: dispatcherUser._id,
            notes: "Requires signature upon delivery."
        });

        // Delivery 3: Delivered with Proof of Delivery
        const delivery3 = await Delivery.create({
            deliveryNumber: "DEL-2026-003",
            customerName: "Global Retail Solutions",
            customerPhone: "+1-555-3003",
            pickupAddress: "220 Distribution Way, Newark, NJ",
            deliveryAddress: "500 Broadway, New York, NY",
            pickupCoordinates: { lat: 40.7357, lng: -74.1724 },
            deliveryCoordinates: { lat: 40.7210, lng: -73.9980 },
            packageDescription: "Fashion apparel cartons",
            packageWeight: 80,
            priority: "MEDIUM",
            scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            status: "DELIVERED",
            assignedDriver: driverUser1._id,
            assignedVehicle: vehicle1._id,
            dispatcher: dispatcherUser._id,
            notes: "Delivered to dock 3."
        });

        const proof3 = await ProofOfDelivery.create({
            delivery: delivery3._id,
            driver: driverUser1._id,
            recipientName: "John Store Manager",
            recipientPhone: "+1-555-3003",
            signature: "John S. Manager (Digital Signature verified)",
            photo: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d",
            notes: "Received in pristine condition at loading bay.",
            deliveredAt: new Date(Date.now() - 22 * 60 * 60 * 1000)
        });

        delivery3.proofOfDelivery = proof3._id;
        await delivery3.save();

        // Delivery 4: Out for delivery
        const delivery4 = await Delivery.create({
            deliveryNumber: "DEL-2026-004",
            customerName: "Metro Office Supplies",
            customerPhone: "+1-555-3004",
            pickupAddress: "15 Industry St, Bronx, NY",
            deliveryAddress: "350 5th Ave (Empire State Building), NY",
            pickupCoordinates: { lat: 40.8448, lng: -73.8648 },
            deliveryCoordinates: { lat: 40.7484, lng: -73.9857 },
            packageDescription: "Office paper and printer toner supplies",
            packageWeight: 120,
            priority: "LOW",
            scheduledDate: new Date(),
            status: "OUT_FOR_DELIVERY",
            assignedDriver: driverUser1._id,
            assignedVehicle: vehicle1._id,
            dispatcher: dispatcherUser._id,
            notes: "Deliver before 5 PM."
        });

        console.log("\n==================================================");
        console.log("FLEETFLOW DATABASE SEEDED SUCCESSFULLY!");
        console.log("==================================================");
        console.log("Development Credentials (Password: Password@123 for all):");
        console.log("1. ADMIN:      admin@fleetflow.com");
        console.log("2. DISPATCHER: dispatcher@fleetflow.com");
        console.log("3. DRIVER 1:   driver1@fleetflow.com");
        console.log("4. DRIVER 2:   driver2@fleetflow.com");
        console.log("==================================================\n");

        process.exit(0);
    } catch (error) {
        console.error("Seeding failed with error:", error);
        process.exit(1);
    }
};

seedDatabase();
