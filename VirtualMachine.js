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

	// instruction set
	const LOAD = 0x01;
	const STORE = 0x02;
	const ADD = 0x03;
	const SUBTRACT = 0x04;
	const HALT = 0xff;

	// internal state. Registers mapped to 0 (program counter), 1, and 2.
	var registers = [0, null, null];

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

		if (instruction === LOAD) { return loadWord; }
		if (instruction === STORE) { return storeWord; }
		if (instruction === ADD) { return function (regAdd1, regAdd2) { registers[regAdd1] += registers[regAdd2]; }; }
		if (instruction === SUBTRACT) { return function (regAdd1, regAdd2) { registers[regAdd1] = registers[regAdd1] - registers[regAdd2]; }; }
	}

	while (program[registers[0]] !== HALT) {
		// 1. fetch instruction and parameters
		var programCounter = registers[0];
		var instruction = program[programCounter];
		var arg1 = program[programCounter + 1];
		var arg2 = program[programCounter + 2];
		// 2. decode instruction, i.e. get function
		var operation = decodeInstruction(instruction);
		// 3. execute instruction, which may modify program memory
		operation(arg1, arg2);
		// all instructions except halt will take up 3 bytes/addresses
		registers[0] += 3;
	}
}

// Test Helpers

// Fetch and translate result based on Little Endian system
function getResult(memory) {
	return memory[14] + (memory[15] * 256);
}

function testResult(memory, expectedResult) {
	console.log('Memory:', memory);
	var result = getResult(memory);
	console.log('New memory:', memory);
	console.log('Result:', result);
	console.log('Expected:', expectedResult);
	console.log(result === expectedResult ? "Passed" : "Failed");
}

// Tests

function test1() {
	// external state/program in mainMemory
	var mainMemory = [
	  0x01, 0x01, 0x10, // LOAD reg1 input1
	  0x01, 0x02, 0x12, // LOAD reg2 input2
	  0x03, 0x01, 0x02, // ADD reg1 adn reg2 and store in reg1
	  0x02, 0x01, 0x0e, // STORE reg1 in output 0e
	  0xff,	// HALT
	  0x00, // blank
	  0x00, 0x00, // output
	  0xa1, 0x14, // input1 (161, 20 = 161 + (20*256)=5281)
	  0x0c, 0x00 // input2 (12)
	];
	virtualComputer(mainMemory);
	var expectedResult = 5293;
	testResult(mainMemory, expectedResult);
}
test1();

// test case: each address contains a single byte of data (2 or fewer hex digits)