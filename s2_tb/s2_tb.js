/**
 Copyright (c) 2016, 2017 Alan Yorinks All right reserved.

 Python Banyan is free software; you can redistribute it and/or
 modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
 Version 3 as published by the Free Software Foundation; either
 or (at your option) any later version.
 This library is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 General Public License for more details.

 You should have received a copy of the GNU AFFERO GENERAL PUBLIC LICENSE
 along with this library; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

(function (ext) {
    var socket = null;
    var connected = false;

    // pin mapping for TECboard rev0
    var pin_map = {
	'A0': 2,
	'A1': 3,
	'A2': 4,
	'A3': 17,
	'A4': 27,
	'A5': 22,
	'I0': 10,
	'I1': 9,
	'I2': 11,
	'I3': 5,
	'I4': 6,
	'I5': 13
    };

    // an array to hold possible digital input values for the reporter block
    var digital_inputs = new Array(32);
    // an array to hold previous digital input values for the hat blocks
    var prev_state = new Array(32);

    var myStatus = 1; // initially yellow
    var myMsg = 'not_ready';

    ext.cnct = function (callback) {
        window.socket = new WebSocket("ws://127.0.0.1:9000");
        window.socket.onopen = function () {
            var msg = JSON.stringify({
                "command": "ready"
            });
            window.socket.send(msg);
            myStatus = 2;

	    // initialize interactive panel inputs
	    for (const pin in pin_map) {
		if (pin.startsWith('I')) {
		    var msg = JSON.stringify({
			"command": 'input', 'pin': pin_map[pin]
		    });
		    window.socket.send(msg);
		}
	    }

            // change status light from yellow to green
            myMsg = 'ready';
            connected = true;

            // initialize the reporter buffer
            digital_inputs.fill('0');
            // initialize the event status buffer
            prev_state.fill('0');

            // give the connection time establish
            window.setTimeout(function() {
		callback();
            }, 1000);
        };

        window.socket.onmessage = function (message) {
            var msg = JSON.parse(message.data);

            // handle the only reporter message from the server
            // for changes in digital input state
            var reporter = msg['report'];
            if(reporter === 'digital_input_change') {
                var pin = msg['pin'];
                digital_inputs[parseInt(pin)] = msg['level'];
            }
            console.log(message.data);
        };

        window.socket.onclose = function (e) {
            console.log("Connection closed.");
            socket = null;
            connected = false;
            myStatus = 1;
            myMsg = 'not_ready';
        };
    };

    // Cleanup function when the extension is unloaded
    ext._shutdown = function () {
        var msg = JSON.stringify({
            "command": "shutdown"
        });
        window.socket.send(msg);
    };

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    ext._getStatus = function (status, msg) {
        return {status: myStatus, msg: myMsg};
    };

    // when the connect to server block is executed
    ext.input = function (pin) {
	console.log("input");
	if (connected == false) {
            alert("Server Not Connected");
        }
	pin = translatePin(pin);
        // validate the pin number for the mode
        if (validatePin(pin)) {
            var msg = JSON.stringify({
                "command": 'input', 'pin': pin
            });
            window.socket.send(msg);
        }
    };

    // when the digital write block is executed
    ext.digital_write = function (pin, state) {
        console.log("digital write");
	if (connected == false) {
            alert("Server Not Connected");
        }
	pin = translatePin(pin);
        // validate the pin number for the mode
        if (validatePin(pin)) {
            var msg = JSON.stringify({
                "command": 'digital_write', 'pin': pin, 'state': state
            });
            console.log(msg);
            window.socket.send(msg);
        }
    };

    // when the PWM block is executed
    ext.analog_write = function (pin, value) {
	console.log("analog write");        
	if (connected == false) {
            alert("Server Not Connected");
        }
	pin = translatePin(pin);
        // validate the pin number for the mode
        if (validatePin(pin)) {
            // validate value to be between 0 and 255
            if (value === 'VAL') {
                alert("PWM Value must be in the range of 0 - 255");
            }
            else {
                value = parseInt(value);
                if (value < 0 || value > 255) {
                    alert("PWM Value must be in the range of 0 - 255");
                }
                else {
                    var msg = JSON.stringify({
                        "command": 'analog_write', 'pin': pin, 'value': value
                    });
                    console.log(msg);
                    window.socket.send(msg);
                }
            }
        }
    };

    // when the Servo block is executed
    ext.servo = function (pin, value) {
        console.log("servo");        
	if (connected == false) {
            alert("Server Not Connected");
        }
	pin = translatePin(pin);
        // validate the pin number for the mode
        if (validatePin(pin)) {
            // validate value to be between 0° and 180°
            if (value === 'VAL') {
                alert("Servo Value must be in the range of 0° - 180°");
            }
            else {
                value = parseInt(value);
                if (value < 0 || value > 180) {
                    alert("Servo Value must be in the range of 0° - 180°");
                }
                else {
                    var msg = JSON.stringify({
                        "command": 'servo', 'pin': pin, 'value': value
                    });
                    console.log(msg);
                    window.socket.send(msg);
                }
            }
        }
    };
	
    // when the play tone block is executed
    ext.play_tone = function (pin, frequency) {
        console.log("play_tone");
	if (connected == false) {
            alert("Server Not Connected");
        }
	pin = translatePin(pin);
        // validate the pin number for the mode
        if (validatePin(pin)) {
            var msg = JSON.stringify({
                "command": 'tone', 'pin': pin, 'frequency': frequency
            });
            console.log(msg);
            window.socket.send(msg);
        }
    };

    // when the digital read reporter block is executed
    ext.digital_read = function (pin) {
	console.log("digital_read");
        if (connected == false) {
            alert("Server Not Connected");
        }
        else {
	    pin = translatePin(pin);
            return digital_inputs[parseInt(pin)]
        }
    };

    // when the pin changes to high
    ext.when_pin_tohigh = function (pin) {
	console.log("when_pin_tohigh");
        if (connected == false) {
            //alert("Server Not Connected");
	    return false;
        }
        else {
	    var _pin = parseInt(translatePin(pin));
	    if (digital_inputs[_pin] == '1' && prev_state[_pin] == '0') {
		prev_state[_pin] = '1'
		return true;
	    }
	    return false;
	}
    };

    // when the pin changes to low
    ext.when_pin_tolow = function (pin) {
	console.log("when_pin_tolow");
        if (connected == false) {
            //alert("Server Not Connected");
	    return false;
        }
        else {
	    var _pin = parseInt(translatePin(pin));
	    if (digital_inputs[_pin] == '0' && prev_state[_pin] == '1') {
		prev_state[_pin] = '0'
		return true;
	    }
	    return false;
	}
    };

    // general function to traslate TECboard pins to GPIO pins
    function translatePin(pin) {
	if (pin.startsWith("A") || pin.startsWith("I")) {
	    return parseInt(pin_map[pin]);
        }
        else {
	    return pin;
	}
    };

    // general function to validate the hardware pin value
    function validatePin(pin) {
        var rValue = true;
        if (pin === 'PIN') {
            alert("Insert a valid BCM pin number.");
            rValue = false;
        }
        else {
            var pinInt = parseInt(pin);
            if (pinInt < 0 || pinInt > 31) {
                alert("BCM pin number must be in the range of 0-31.");
                rValue = false;
            }
        }
        return rValue;
    };

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            // Block type, block name, function name
	    ["w", 'Connect to the TECBOOK panel.', 'cnct'],
	    [" ", 'Set BCM %m.adv_pins as an Input', 'input','PIN'],
	    [" ", "Set BCM %m.adv_pins Output to %m.high_low", "digital_write",
	     "PIN", "0"],
	    [" ", "Set BCM PWM Out %m.adv_pins to %n", "analog_write",
	     "PIN", "VAL"],
	    [" ", "Set BCM %m.adv_pins as Servo with angle = %n (0° - 180°)",
	     "servo", "PIN", "0"],
	    [" ", "Tone: BCM %m.adv_pins HZ: %n", "play_tone", "PIN", 1000],
	    ["r", "Read Digital Pin %m.adv_pins", "digital_read", "PIN"],
	    ["h", "When Pin %m.adv_pins is touched", "when_pin_tolow", "I0"],
	    ["h", "When Pin %m.adv_pins is released", "when_pin_tohigh", "I0"]
        ],
        menus: {
            high_low: ["0", "1"],
	    int_pins: ["I0","I1","I2","I3","I4","I5"],
	    adv_pins: ["A0","A1","A2","A3","A4","A5"]
        },
        url: 'http://teceduc.github.io/s2-tecbook'
    };

    // Register the extension
    ScratchExtensions.register('TECBOOK', descriptor, ext);
})({});
