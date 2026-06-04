const seatModel= {
    id:string,
    planeId:string,
    seatNumber: {
        type: String,
        required: true,
    },
    class: {
        type: String,
        enum: ['Economy', 'Business', 'First'],
        required: true,
    },
    isWindow: {
        type: Boolean,
        default: false,
    },
    isAisle: {
        type: Boolean,
        default: false,
    }, 
    plane,
    bookingSegments
}