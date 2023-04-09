var app = new Vue({
    el: '#hamming-encoder',
    data: {
        dataBits: [],
        status: '',
        numberOfDataBits: 4
    },
    created: function () {
        this.initDataBits(4);
    },
    methods: {
        initDataBits: function(){
            this.dataBits=[];
            
            for(var i=0;i<this.numberOfDataBits;i++){
                var bit = { data: null };
                this.dataBits.push(bit);
            }
        },
        send: function () {
            if (this.validate(this.dataBits) === true){
                var encodedMessage = this.encode(this.dataBits);
                // this.status = encodedMessage + ' encoded sent to server';

                return axios.put("http://localhost:3000/message", {bits: encodedMessage}).then(
                    response => (this.status = response.data)
                );
            } else {
                this.status = 'Input is not valid. Please use 0 or 1 as data bit values';
            }
        },
        encode: function (bits) {
            if (bits.length == 4) {
                var c4 = this.parity(parseInt(bits[1].data) + parseInt(bits[2].data) + parseInt(bits[3].data)); // se calculeaza bitul de control de pe pozitia 4
                var c2 = this.parity(parseInt(bits[0].data) + parseInt(bits[2].data) + parseInt(bits[3].data)); // se calculeaza bitul de control de pe pozitia 2
                var c1 = this.parity(parseInt(bits[0].data) + parseInt(bits[1].data) + parseInt(bits[3].data)); // se calculeaza bitul de control de pe pozitia 1
                var c0 = this.parity(parseInt(bits[0].data) + parseInt(bits[1].data) + parseInt(bits[2].data) + parseInt(bits[3].data) + c1 + c2 + c4);

                console.log("Control bits: " + c1 + "," + c2 + "," + c4);
                console.log("Parity bit:" + c0);

                encoded = [c0, c1, c2, parseInt(bits[0].data), c4, parseInt(bits[1].data), parseInt(bits[2].data), parseInt(bits[3].data)];
                console.log("ENCODED MESSAGE: " + encoded.join(''));

                return encoded; // vectorul V (cuvantul de transmis)
            }
            else {
                var c1 = this.parity(parseInt(bits[0].data) + parseInt(bits[1].data) + parseInt(bits[3].data));
                var c2 = this.parity(parseInt(bits[0].data) + parseInt(bits[2].data) + parseInt(bits[3].data));
                var c4 = this.parity(parseInt(bits[1].data) + parseInt(bits[2].data) + parseInt(bits[3].data));
                var c8 = this.parity(parseInt(bits[3].data) + parseInt(bits[4].data) + parseInt(bits[5].data) + parseInt(bits[6].data));

                sum = 0;
                for (i = 0; i < 8; i++)
                    sum += parseInt(bits[i].data);
                var c0 = this.parity(sum + c1 + c2 + c4 + c8);

                console.log("Control bits: " + c1 + "," + c2 + "," + c4 + "," + c8);
                console.log("Parity bits: " + c0);

                encoded = [c0, c1, c2, parseInt(bits[0].data), c4, parseInt(bits[1].data), parseInt(bits[2].data), parseInt(bits[3].data), c8, parseInt(bits[4].data), parseInt(bits[5].data), parseInt(bits[6].data), parseInt(bits[7].data)];
                console.log("ENCODED MESSAGE: " + encoded.join(''));

                return encoded;
            }
        },
        parity: function(number){
            return number % 2;
        },
        validate: function(bits){
            for(var i=0; i<bits.length;i++){
                if (this.validateBit(bits[i].data) === false)
                return false;
            }
            return true;
        },
        validateBit: function(character){
            if (character === null) return false;
            return (parseInt(character) === 0 ||
            parseInt(character) === 1);  
        }
    }
})