const seatModel= {
    seatNumber: {
        type: String,
        required: true,
    },
    class: {
        type: String,
        enum: ['Economy', 'Business', 'First'],
        required: true,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
    price: {
        type: Number,
        required: true,
    },
    flightId: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}