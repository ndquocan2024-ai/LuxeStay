class Room {
    #isBooked = false;
    #basePrice = 0;

    constructor(id, type, floor, basePrice) {
        this.id = id;
        this.type = type;
        this.floor = floor;
        this.basePrice = basePrice;
    }

    get basePrice() {
        return this.#basePrice;
    }

    set basePrice(value) {
        if (value < 0) {
            throw new Error("Price must be positive!");
        }
        this.#basePrice = value;
    }

    get isBooked() { return this.#isBooked; }

    book() {
        if (this.#isBooked) throw new Error(`Room ${this.id} is already booked`);
        this.#isBooked = true;
        return true;
    }

    cancel() {
        this.#isBooked = false;
    }


    getPrice() {
        return this.basePrice;
    }

    toJSON() {
        const { id, type, floor, basePrice, isBooked } = this;
        return { id, type, floor, basePrice, isBooked };
    }

    static fromJSON({ id, type, floor, basePrice, isBooked }) {
        const room = new Room(id, type, floor, basePrice);
        if (isBooked) room.book();
        return room;
    }
}

class Customers {
    constructor(id, name, phone, referredBy = null) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.referredBy = referredBy;
    }
}

class BookingSystem {
    constructor(room = [], customer = [], booking_history = []) {
        this.rooms = room;
        this.customers = customer;
        this.booking_history = booking_history;
    }

    addRoom(room) {
        this.rooms.push(room);
    }

    addCustomer(customer) {
        this.customers.push(customer);
    }

    addBooking(booking) {
        this.booking_history.push(booking);
    }

    roomsAvailable(minPrice, maxPrice) {
        return this.rooms.filter(room => room.getPrice() >= minPrice && room.getPrice() <= maxPrice && !room.isBooked);
    }
}
