export async function main(ns: NS) {
  ns.tprint(testMinimumPath());
}

interface BinaryTree {
  val: number;
  left: BinaryTree | undefined;
  right: BinaryTree | undefined;
}

function buildBinaryTreeOf(triangle: number[][]): BinaryTree {
  for (let i = 0; i < triangle.length; i++) {
    for (let j = 0; j < triangle[i].length; j++) {
      const binaryTree: BinaryTree = {
        val = triangle[i][j],
        left = triangle[i + 1][j],
        right = triangle[i + 1][j + 1],
      };
    }
  }
  return binaryTree;
}

function testMinimumPath() {
  const triangle = [[2], [3, 4], [6, 5, 7], [4, 1, 8, 3]];
  const minimumPathSum = minimumPath(triangle);
  return minimumPathSum;
}

export function minimumPath(triangle: number[][], index = 0): number {
  const left = minimumPath(triangle[index], ++index);
  const right = minimumPath(triangle, ++index);

  return minimumPathSum;
}
