/*
Create a VM that emulates the fetch-decode-execute cycle of an instruction in a CPU.

Our computer follows a convention for organizing memory. 20 bytes of memory are divided into 3 sections: instructions, input, and output.
The instructions occupy the first 14 bytes, followed by 2 bytes for output and 4 bytes for two separate 2 byte inputs:

00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f 10 11 12 13 // javascript can interpret decimal, hexidecimal, and binary indices
__ __ __ __ __ __ __ __ __ __ __ __ __ __ __ __ __ __ __ __
INSTRUCTIONS ---------------------------^ OUT-^ IN-1^ IN-2^

Map the 5 instructions to these bytes:
load_word   0x01
store_word  0x02
add         0x03
sub         0x04
halt        0xff

Map the registers to these bytes:
0x01 and 0x02 (reserving value 0x00 for the program counter).

All the instructions except halt will take three bytes—and halt, just one—to encode
*/

function virtualComputer(program) { // program is an array of 20 bytes of main memory
	if (!program || program.length !== 20 || !Array.isArray(program)) { return; }

	// internal state
	var programCounter = 0;
	var registers = [programCounter, null, null];

	var done = false;
	function decodeInstruction(instruction) {
		// load input into register
		var loadWord = function(registerAddress, inputAddress) {
			// fetch values
			var input = program[inputAddress] + (program[inputAddress + 1] * 256);
		    // bitwise operation: var input = program[inputAddress] + (program[inputAddress + 1] << 8);

			// assume that the registers can hold 16 bit (2 byte) numbers directly
			registers[registerAddress] = input;
		};

		// Store register's value into output. Assumes outputAddress is the lower index/address of the two bytes of memory for output
		var storeWord = function(registerAddress, outputAddress) {
			var value = registers[registerAddress];
			// This is a “little endian” system, meaning the “least significant byte”
			// of our inputs and outputs occupy the smaller array index location.
			var smallValue = value % 256; // bitwise operation: value & 0x00ff
			var bigValue = Math.floor(value / 256); // bitwise operation: value >> 8
			program[outputAddress] = smallValue;
			program[outputAddress + 1] = bigValue;
		};

		var add =  function (regAdd1, regAdd2) { registers[regAdd1] += registers[regAdd2]; };
		var subtract =  function (regAdd1, regAdd2) { registers[regAdd1] = registers[regAdd1] - registers[regAdd2]; };
		var halt = function () { done = true; }

		var decodeMap = {
			0x01: loadWord,
			0x02: storeWord,
			0x03: add,
			0x04: subtract,
			0xff: halt
		};

		return decodeMap[instruction];
	}


	for (var i = 0; i < program.length; i++) {
		// if we are starting an instruction
		if (i === programCounter) {
			// 1. fetch instruction and parameters
			var instruction = program[i];
			var param1 = program[i + 1];
			var param2 = program[i + 2];
			// 2. decode instruction, i.e. get function
			action = decodeInstruction(instruction);
			// 3. execute instruction, which may modify program memory
			action(param1, param2);

			if (done === true) {
				programCounter = program.length;
				break;
			} else {
				// all instructions except halt will take up 3 bytes/addresses.
				programCounter += 3;
			}
		}
	}

}

// TESTS

function test1() {
	// external state/program in mainMemory
	var mainMemory = [
	  0x01, 0x01, 0x10,
	  0x01, 0x02, 0x12,
	  0x03, 0x01, 0x02,
	  0x02, 0x01, 0x0e,
	  0xff,
	  0x00,
	  0x00, 0x00,
	  0xa1, 0x14,
	  0x0c, 0x00
	];
	console.log(mainMemory);

	var expected = 5293;
	virtualComputer(mainMemory);
	var result = mainMemory[14] + (mainMemory[15] * 256);
	console.log('Result:', result);
	console.log('Expected:', expected);
	console.log(result === expected); // pass!
	console.log(mainMemory);
}
test1();

// test case: each address contains a single byte of data (2 or fewer hex digits)