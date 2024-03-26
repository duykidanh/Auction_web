import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import * as fs from 'fs';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { Console, debug, log } from 'console';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { fileURLToPath } from 'url';
import { ProductService } from '../../../services/product.service';
import { ChatRoomService } from '../../../services/chat-room.service';
import { response } from 'express';

@Component({
  selector: 'app-create-chat-room',
  templateUrl: './create-chat-room.component.html',
  styleUrl: './create-chat-room.component.css'
})

export class CreateChatRoomComponent implements OnInit {
  ProductList: any[] = [];
  StatusList: any[] = [];
  userId: any;
  enableSubmit: any;
  productIdEdit: any;
  CreateChatRoomForm!: FormGroup;
  checkedStates: boolean[] = [];
  uploadedImages: string[] = [];
  isInputDisabled: boolean = true;
  startDate: any;
  productToAddRoom: any[] = [];
  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private productService: ProductService,
    private http: HttpClient,
    private location: Location,
    private chatRoomService: ChatRoomService
  ) { }
  ngOnInit(): void {
    this.CreateChatRoomForm = this.fb.group({
      StartDate: ['', Validators.required]
    });
    if (typeof document !== 'undefined') {
      this.userId = sessionStorage?.getItem('id');

      this.enableSubmit = true;
      console.log(this.enableSubmit)
      this.productService.getProductsWithStatus(1).subscribe((data: any) => {
        console.log(data)

        this.ProductList = data.response;

        this.ProductList.forEach(() => {
          this.checkedStates.push(false);
        });
      })

      this.productService.getStatusList().subscribe((data1: any) => {
        console.log(data1)

        this.StatusList = data1.response;
      })
    }

  }

  onCancel(): void {
    this.CreateChatRoomForm = this.fb.group({
      StartDate: ['', [Validators.required, futureDateValidator()]]
    });
    this.startDate = null;
    const endDateInput: HTMLInputElement | null = document.getElementById('endDate') as HTMLInputElement;
    if (endDateInput) {
      endDateInput.value = '';
    }
    this.checkedStates.fill(false);
    this.enableSubmit = true;
    this.productToAddRoom = [];
  }

  getCurrentDateTime(): string {
    const now = new Date();
    // Format the current date and time to match the format required by datetime-local input
    const formattedDateTime = `${now.getFullYear()}-${this.padZero(now.getMonth() + 1)}-${this.padZero(now.getDate())}T${this.padZero(now.getHours())}:${this.padZero(now.getMinutes())}`;
    return formattedDateTime;
  }

  padZero(num: number): string {
    return (num < 10 ? '0' : '') + num;
  }

  TestCheckBox(event: Event, index: number) {
    const target = event.target as HTMLInputElement;
    if (target && target instanceof HTMLInputElement) {
      if (target.checked) {
        this.productToAddRoom.push(this.ProductList.at(index));
        if (this.startDate) {
          this.setEndDate();
        }
        this.checkedStates[index] = target.checked;
      }
      else {
        for (let i = 0; i < this.productToAddRoom.length; i++) {
          if (this.productToAddRoom[i].productId == target.value) {
            this.productToAddRoom.splice(i, 1);
            this.setEndDate();
            break;
          }
        }
        this.checkedStates[index] = target.checked;
      }
    }
  }

  handleInput(event: any) {
    this.enableSubmit = false;
    const inputValue: string = event.target.value;
    this.startDate = new Date(inputValue);
    this.setEndDate();
    
  }

  setEndDate() {
    if(this.startDate){
      let startDate = new Date(this.startDate.getTime());
      console.log(startDate.valueOf())
      const endDateInput: HTMLInputElement | null = document.getElementById('endDate') as HTMLInputElement;
      if(isNaN(startDate.valueOf())){
        endDateInput.value = '';
      }
      else{
        startDate.setMinutes(startDate.getMinutes() + 5 + 35 * this.productToAddRoom.length);
  
        // Get the time zone offset in minutes
        const offsetMinutes = startDate.getTimezoneOffset();
    
        // Adjust for the time zone offset
        startDate.setMinutes(startDate.getMinutes() - offsetMinutes);
    
        const formattedEndDate = startDate.toISOString().slice(0, 16);
        
        if (endDateInput) {
          endDateInput.value = formattedEndDate;
        }
      }

    }
    
  }

  onSubmit(): void {
    const payload = {
      startDate: this.startDate
    };
    console.log(payload.startDate);
    this.chatRoomService.createChatRoom(payload).subscribe({
      next: (response: any) => {
        const chatRoomId = response.response.chatRoomId;
        const products: any[] = [];
        this.productToAddRoom.forEach(element => {
          products.push(element.productId);
        });
        const data = {
          ChatRoomId: chatRoomId,
          ProductIds: products
        };
        console.log(response)
        console.log(chatRoomId)
        this.chatRoomService.registerProductToChatRoom(data).subscribe({
          complete:() => {
              var answer = window.alert("Success"); this.onCancel(); window.location.reload() 
          }
        })
      }
    });
  }


}

function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const selectedDate = new Date(control.value);
    const currentDate = new Date();
    
    if (selectedDate <= currentDate) {
      return { futureDate: true }; // Return validation error if date is not in the future
    }
    
    return null; // Return null if validation passes
  };
}