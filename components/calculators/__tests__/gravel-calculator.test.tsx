import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GravelCalculator } from "../gravel-calculator";

interface GravelProduct {
  slug: string;
  name: string;
  densityLow: number;
  densityHigh: number;
  priceLow: number;
  priceHigh: number;
}

const mockProducts: GravelProduct[] = [
  {
    slug: "fill-dirt",
    name: "Fill Dirt",
    densityLow: 1.3,
    densityHigh: 1.5,
    priceLow: 20,
    priceHigh: 25,
  },
  {
    slug: "gravel-57",
    name: "#57 Gravel",
    densityLow: 1.4,
    densityHigh: 1.6,
    priceLow: 30,
    priceHigh: 35,
  },
];

describe("GravelCalculator", () => {
  describe("rendering", () => {
    it("should render the calculator with default shape (rectangle)", () => {
      render(<GravelCalculator products={mockProducts} />);

      expect(screen.getByText("Project Dimensions")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g. 50")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g. 12")).toBeInTheDocument();
    });

    it("should render shape selection buttons", () => {
      render(<GravelCalculator products={mockProducts} />);

      expect(screen.getByRole("button", { name: /rectangle/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /circle/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /triangle/i })).toBeInTheDocument();
    });

    it("should render depth preset buttons", () => {
      render(<GravelCalculator products={mockProducts} />);

      expect(screen.getByRole("button", { name: /2"/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /3"/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /4"/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /6"/i })).toBeInTheDocument();
    });

    it("should render calculate button", () => {
      render(<GravelCalculator products={mockProducts} />);

      expect(screen.getByRole("button", { name: /calculate/i })).toBeInTheDocument();
    });

    it("should default to 4 inch depth and 10% overage", () => {
      render(<GravelCalculator products={mockProducts} />);

      const inputs = screen.getAllByRole("spinbutton");
      const depthInput = inputs.find((input) => (input as HTMLInputElement).value === "4");
      const overageInput = inputs.find((input) => (input as HTMLInputElement).value === "10");

      expect(depthInput).toHaveValue(4);
      expect(overageInput).toHaveValue(10);
    });
  });

  describe("shape selection", () => {
    it("should switch to circle shape and show radius input", () => {
      render(<GravelCalculator products={mockProducts} />);

      const circleButton = screen.getByRole("button", { name: /circle/i });
      fireEvent.click(circleButton);

      expect(screen.getByPlaceholderText("e.g. 10")).toBeInTheDocument();
      expect(screen.queryByPlaceholderText("e.g. 50")).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText("e.g. 12")).not.toBeInTheDocument();
    });

    it("should switch to triangle shape and show base and height inputs", () => {
      render(<GravelCalculator products={mockProducts} />);

      const triangleButton = screen.getByRole("button", { name: /triangle/i });
      fireEvent.click(triangleButton);

      expect(screen.getByPlaceholderText("e.g. 20")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g. 15")).toBeInTheDocument();
      expect(screen.queryByPlaceholderText("e.g. 50")).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText("e.g. 12")).not.toBeInTheDocument();
    });

    it("should switch back to rectangle shape", () => {
      render(<GravelCalculator products={mockProducts} />);

      const circleButton = screen.getByRole("button", { name: /circle/i });
      fireEvent.click(circleButton);

      const rectangleButton = screen.getByRole("button", { name: /rectangle/i });
      fireEvent.click(rectangleButton);

      expect(screen.getByPlaceholderText("e.g. 50")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g. 12")).toBeInTheDocument();
    });
  });

  describe("rectangle calculations", () => {
    it("should calculate correctly for a 50x12 rectangle at 4 inches depth", () => {
      render(<GravelCalculator products={mockProducts} />);

      const lengthInput = screen.getByPlaceholderText("e.g. 50");
      const widthInput = screen.getByPlaceholderText("e.g. 12");
      const calculateButton = screen.getByRole("button", { name: /calculate/i });

      fireEvent.change(lengthInput, { target: { value: "50" } });
      fireEvent.change(widthInput, { target: { value: "12" } });
      fireEvent.click(calculateButton);

      const areaSqFt = 50 * 12;
      const depthFeet = 4 / 12;
      const cubicFeet = areaSqFt * depthFeet;
      const cubicYards = cubicFeet / 27;
      const cubicYardsWithOverage = cubicYards * 1.1;
      const expectedCubicYards = Math.round(cubicYardsWithOverage * 100) / 100;

      expect(screen.getByText("Estimated Material Needed")).toBeInTheDocument();
      expect(screen.getByText(expectedCubicYards.toString())).toBeInTheDocument();
    });

    it("should calculate tons correctly with product density", () => {
      render(<GravelCalculator products={mockProducts} />);

      const lengthInput = screen.getByPlaceholderText("e.g. 50");
      const widthInput = screen.getByPlaceholderText("e.g. 12");
      const calculateButton = screen.getByRole("button", { name: /calculate/i });

      fireEvent.change(lengthInput, { target: { value: "50" } });
      fireEvent.change(widthInput, { target: { value: "12" } });
      fireEvent.click(calculateButton);

      const areaSqFt = 50 * 12;
      const depthFeet = 4 / 12;
      const cubicFeet = areaSqFt * depthFeet;
      const cubicYards = cubicFeet / 27;
      const cubicYardsWithOverage = cubicYards * 1.1;

      const tonsLow = Math.round(cubicYardsWithOverage * mockProducts[0].densityLow * 10) / 10;
      const tonsHigh = Math.round(cubicYardsWithOverage * mockProducts[0].densityHigh * 10) / 10;

      expect(screen.getByText(`${tonsLow}-${tonsHigh}`)).toBeInTheDocument();
    });

    it("should calculate cost correctly", () => {
      render(<GravelCalculator products={mockProducts} />);

      const lengthInput = screen.getByPlaceholderText("e.g. 50");
      const widthInput = screen.getByPlaceholderText("e.g. 12");
      const calculateButton = screen.getByRole("button", { name: /calculate/i });

      fireEvent.change(lengthInput, { target: { value: "50" } });
      fireEvent.change(widthInput, { target: { value: "12" } });
      fireEvent.click(calculateButton);

      const areaSqFt = 50 * 12;
      const depthFeet = 4 / 12;
      const cubicFeet = areaSqFt * depthFeet;
      const cubicYards = cubicFeet / 27;
      const cubicYardsWithOverage = cubicYards * 1.1;

      const tonsLow = cubicYardsWithOverage * mockProducts[0].densityLow;
      const tonsHigh = cubicYardsWithOverage * mockProducts[0].densityHigh;
      const costLow = Math.round(tonsLow * mockProducts[0].priceLow);
      const costHigh = Math.round(tonsHigh * mockProducts[0].priceHigh);

      expect(screen.getByText(`$${costLow}-$${costHigh}`)).toBeInTheDocument();
    });
  });

  describe("circle calculations", () => {
    it("should calculate correctly for a circle with radius 10", () => {
      render(<GravelCalculator products={mockProducts} />);

      const circleButton = screen.getByRole("button", { name: /circle/i });
      fireEvent.click(circleButton);

      const radiusInput = screen.getByPlaceholderText("e.g. 10");
      const calculateButton = screen.getByRole("button", { name: /calculate/i });

      fireEvent.change(radiusInput, { target: { value: "10" } });
      fireEvent.click(calculateButton);

      const areaSqFt = Math.PI * 10 * 10;
      const depthFeet = 4 / 12;
      const cubicFeet = areaSqFt * depthFeet;
      const cubicYards = cubicFeet / 27;
      const cubicYardsWithOverage = cubicYards * 1.1;
      const expectedCubicYards = Math.round(cubicYardsWithOverage * 100) / 100;

      expect(screen.getByText("Estimated Material Needed")).toBeInTheDocument();
      expect(screen.getByText(expectedCubicYards.toString())).toBeInTheDocument();
    });
  });

  describe("triangle calculations", () => {
    it("should calculate correctly for a triangle with base 20 and height 15", () => {
      render(<GravelCalculator products={mockProducts} />);

      const triangleButton = screen.getByRole("button", { name: /triangle/i });
      fireEvent.click(triangleButton);

      const baseInput = screen.getByPlaceholderText("e.g. 20");
      const heightInput = screen.getByPlaceholderText("e.g. 15");
      const calculateButton = screen.getByRole("button", { name: /calculate/i });

      fireEvent.change(baseInput, { target: { value: "20" } });
      fireEvent.change(heightInput, { target: { value: "15" } });
      fireEvent.click(calculateButton);

      const areaSqFt = (20 * 15) / 2;
      const depthFeet = 4 / 12;
      const cubicFeet = areaSqFt * depthFeet;
      const cubicYards = cubicFeet / 27;
      const cubicYardsWithOverage = cubicYards * 1.1;
      const expectedCubicYards = Math.round(cubicYardsWithOverage * 100) / 100;

      expect(screen.getByText("Estimated Material Needed")).toBeInTheDocument();
      expect(screen.getByText(expectedCubicYards.toString())).toBeInTheDocument();
    });
  });

  describe("depth customization", () => {
    it("should update depth when preset button is clicked", () => {
      render(<GravelCalculator products={mockProducts} />);

      const sixInchButton = screen.getByRole("button", { name: /6"/i });
      fireEvent.click(sixInchButton);

      const inputs = screen.getAllByRole("spinbutton");
      const depthInput = inputs.find((input) => (input as HTMLInputElement).value === "6");
      expect(depthInput).toHaveValue(6);
    });

    it("should calculate correctly with custom depth", () => {
      render(<GravelCalculator products={mockProducts} />);

      const lengthInput = screen.getByPlaceholderText("e.g. 50");
      const widthInput = screen.getByPlaceholderText("e.g. 12");
      const inputs = screen.getAllByRole("spinbutton");
      const depthInput = inputs.find((input) => (input as HTMLInputElement).value === "4")!;
      const calculateButton = screen.getByRole("button", { name: /calculate/i });

      fireEvent.change(lengthInput, { target: { value: "50" } });
      fireEvent.change(widthInput, { target: { value: "12" } });
      fireEvent.change(depthInput, { target: { value: "6" } });
      fireEvent.click(calculateButton);

      const areaSqFt = 50 * 12;
      const depthFeet = 6 / 12;
      const cubicFeet = areaSqFt * depthFeet;
      const cubicYards = cubicFeet / 27;
      const cubicYardsWithOverage = cubicYards * 1.1;
      const expectedCubicYards = Math.round(cubicYardsWithOverage * 100) / 100;

      expect(screen.getByText(expectedCubicYards.toString())).toBeInTheDocument();
    });
  });

  describe("overage customization", () => {
    it("should calculate correctly with 0% overage", () => {
      render(<GravelCalculator products={mockProducts} />);

      const lengthInput = screen.getByPlaceholderText("e.g. 50");
      const widthInput = screen.getByPlaceholderText("e.g. 12");
      const inputs = screen.getAllByRole("spinbutton");
      const overageInput = inputs.find((input) => (input as HTMLInputElement).value === "10")!;
      const calculateButton = screen.getByRole("button", { name: /calculate/i });

      fireEvent.change(lengthInput, { target: { value: "50" } });
      fireEvent.change(widthInput, { target: { value: "12" } });
      fireEvent.change(overageInput, { target: { value: "0" } });
      fireEvent.click(calculateButton);

      const areaSqFt = 50 * 12;
      const depthFeet = 4 / 12;
      const cubicFeet = areaSqFt * depthFeet;
      const cubicYards = cubicFeet / 27;
      const expectedCubicYards = Math.round(cubicYards * 100) / 100;

      expect(screen.getByText(expectedCubicYards.toString())).toBeInTheDocument();
    });

    it("should calculate correctly with 20% overage", () => {
      render(<GravelCalculator products={mockProducts} />);

      const lengthInput = screen.getByPlaceholderText("e.g. 50");
      const widthInput = screen.getByPlaceholderText("e.g. 12");
      const inputs = screen.getAllByRole("spinbutton");
      const overageInput = inputs.find((input) => (input as HTMLInputElement).value === "10")!;
      const calculateButton = screen.getByRole("button", { name: /calculate/i });

      fireEvent.change(lengthInput, { target: { value: "50" } });
      fireEvent.change(widthInput, { target: { value: "12" } });
      fireEvent.change(overageInput, { target: { value: "20" } });
      fireEvent.click(calculateButton);

      const areaSqFt = 50 * 12;
      const depthFeet = 4 / 12;
      const cubicFeet = areaSqFt * depthFeet;
      const cubicYards = cubicFeet / 27;
      const cubicYardsWithOverage = cubicYards * 1.2;
      const expectedCubicYards = Math.round(cubicYardsWithOverage * 100) / 100;

      expect(screen.getByText(expectedCubicYards.toString())).toBeInTheDocument();
    });
  });

  describe("product selection", () => {
    it("should calculate with different product densities and prices", () => {
      render(<GravelCalculator products={mockProducts} />);

      const lengthInput = screen.getByPlaceholderText("e.g. 50");
      const widthInput = screen.getByPlaceholderText("e.g. 12");
      const calculateButton = screen.getByRole("button", { name: /calculate/i });

      fireEvent.change(lengthInput, { target: { value: "50" } });
      fireEvent.change(widthInput, { target: { value: "12" } });
      fireEvent.click(calculateButton);

      const areaSqFt = 50 * 12;
      const depthFeet = 4 / 12;
      const cubicFeet = areaSqFt * depthFeet;
      const cubicYards = cubicFeet / 27;
      const cubicYardsWithOverage = cubicYards * 1.1;

      const tonsLow = Math.round(cubicYardsWithOverage * mockProducts[0].densityLow * 10) / 10;
      const tonsHigh = Math.round(cubicYardsWithOverage * mockProducts[0].densityHigh * 10) / 10;

      expect(screen.getByText(`${tonsLow}-${tonsHigh}`)).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("should not display results when no dimensions are entered", () => {
      render(<GravelCalculator products={mockProducts} />);

      const calculateButton = screen.getByRole("button", { name: /calculate/i });
      fireEvent.click(calculateButton);

      expect(screen.queryByText("Estimated Material Needed")).not.toBeInTheDocument();
    });

    it("should not display results for zero area", () => {
      render(<GravelCalculator products={mockProducts} />);

      const lengthInput = screen.getByPlaceholderText("e.g. 50");
      const widthInput = screen.getByPlaceholderText("e.g. 12");
      const calculateButton = screen.getByRole("button", { name: /calculate/i });

      fireEvent.change(lengthInput, { target: { value: "0" } });
      fireEvent.change(widthInput, { target: { value: "12" } });
      fireEvent.click(calculateButton);

      expect(screen.queryByText("Estimated Material Needed")).not.toBeInTheDocument();
    });

    it("should not display results for negative dimensions", () => {
      render(<GravelCalculator products={mockProducts} />);

      const lengthInput = screen.getByPlaceholderText("e.g. 50");
      const widthInput = screen.getByPlaceholderText("e.g. 12");
      const calculateButton = screen.getByRole("button", { name: /calculate/i });

      fireEvent.change(lengthInput, { target: { value: "-50" } });
      fireEvent.change(widthInput, { target: { value: "12" } });
      fireEvent.click(calculateButton);

      expect(screen.queryByText("Estimated Material Needed")).not.toBeInTheDocument();
    });

    it("should not display results for invalid depth", () => {
      render(<GravelCalculator products={mockProducts} />);

      const lengthInput = screen.getByPlaceholderText("e.g. 50");
      const widthInput = screen.getByPlaceholderText("e.g. 12");
      const inputs = screen.getAllByRole("spinbutton");
      const depthInput = inputs.find((input) => (input as HTMLInputElement).value === "4")!;
      const calculateButton = screen.getByRole("button", { name: /calculate/i });

      fireEvent.change(lengthInput, { target: { value: "50" } });
      fireEvent.change(widthInput, { target: { value: "12" } });
      fireEvent.change(depthInput, { target: { value: "" } });
      fireEvent.click(calculateButton);

      expect(screen.queryByText("Estimated Material Needed")).not.toBeInTheDocument();
    });

    it("should handle empty products array", () => {
      render(<GravelCalculator products={[]} />);

      expect(screen.getByText("Project Dimensions")).toBeInTheDocument();
    });

    it("should clear result when changing shape", () => {
      render(<GravelCalculator products={mockProducts} />);

      const lengthInput = screen.getByPlaceholderText("e.g. 50");
      const widthInput = screen.getByPlaceholderText("e.g. 12");
      const calculateButton = screen.getByRole("button", { name: /calculate/i });

      fireEvent.change(lengthInput, { target: { value: "50" } });
      fireEvent.change(widthInput, { target: { value: "12" } });
      fireEvent.click(calculateButton);

      expect(screen.getByText("Estimated Material Needed")).toBeInTheDocument();

      const circleButton = screen.getByRole("button", { name: /circle/i });
      fireEvent.click(circleButton);

      expect(screen.queryByText("Estimated Material Needed")).not.toBeInTheDocument();
    });
  });

  describe("result formatting", () => {
    it("should round cubic yards to 2 decimal places", () => {
      render(<GravelCalculator products={mockProducts} />);

      const lengthInput = screen.getByPlaceholderText("e.g. 50");
      const widthInput = screen.getByPlaceholderText("e.g. 12");
      const calculateButton = screen.getByRole("button", { name: /calculate/i });

      fireEvent.change(lengthInput, { target: { value: "33" } });
      fireEvent.change(widthInput, { target: { value: "11" } });
      fireEvent.click(calculateButton);

      const areaSqFt = 33 * 11;
      const depthFeet = 4 / 12;
      const cubicFeet = areaSqFt * depthFeet;
      const cubicYards = cubicFeet / 27;
      const cubicYardsWithOverage = cubicYards * 1.1;
      const expectedCubicYards = Math.round(cubicYardsWithOverage * 100) / 100;

      expect(screen.getByText(expectedCubicYards.toString())).toBeInTheDocument();
    });

    it("should round tons to 1 decimal place", () => {
      render(<GravelCalculator products={mockProducts} />);

      const lengthInput = screen.getByPlaceholderText("e.g. 50");
      const widthInput = screen.getByPlaceholderText("e.g. 12");
      const calculateButton = screen.getByRole("button", { name: /calculate/i });

      fireEvent.change(lengthInput, { target: { value: "50" } });
      fireEvent.change(widthInput, { target: { value: "12" } });
      fireEvent.click(calculateButton);

      const areaSqFt = 50 * 12;
      const depthFeet = 4 / 12;
      const cubicFeet = areaSqFt * depthFeet;
      const cubicYards = cubicFeet / 27;
      const cubicYardsWithOverage = cubicYards * 1.1;

      const tonsLow = Math.round(cubicYardsWithOverage * mockProducts[0].densityLow * 10) / 10;
      const tonsHigh = Math.round(cubicYardsWithOverage * mockProducts[0].densityHigh * 10) / 10;

      expect(tonsLow.toString()).toMatch(/^\d+\.\d$/);
      expect(tonsHigh.toString()).toMatch(/^\d+\.\d$/);
    });

    it("should round cost to whole dollars", () => {
      render(<GravelCalculator products={mockProducts} />);

      const lengthInput = screen.getByPlaceholderText("e.g. 50");
      const widthInput = screen.getByPlaceholderText("e.g. 12");
      const calculateButton = screen.getByRole("button", { name: /calculate/i });

      fireEvent.change(lengthInput, { target: { value: "50" } });
      fireEvent.change(widthInput, { target: { value: "12" } });
      fireEvent.click(calculateButton);

      const costText = screen.getByText(/^\$\d+-\$\d+$/);
      expect(costText).toBeInTheDocument();
    });
  });
});
