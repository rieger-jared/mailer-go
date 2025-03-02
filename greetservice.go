package main

import "fmt"

type GreetService struct{}

func (g *GreetService) Greet(p Person) string {
    return fmt.Sprintf("Hello %s (Age: %d)!", p.Name, p.Age)
}

type Person struct {
    Name string `json:"name"`
    Age uint8 `json:"age"`
    Address *Address `json:"address"`
}

type Address struct {
    Street string `json:"street"`
    Postcode string `json:"postcode"`
}

